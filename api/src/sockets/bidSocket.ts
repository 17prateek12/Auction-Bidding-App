import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { DecodeToken } from '../interface/interface';
import { placeBidService, getLeaderboardService, maskLeaderboardForViewer } from '../services/bidService';
import { pool } from '../connection/postgresConfig';
import { ApiError } from '../utils/ApiError';

// Module-level cache for Socket.io server instance
let ioInstance: Server | null = null;

export const setIoInstance = (io: Server) => {
  ioInstance = io;
};

export const getSocket = (): Server | null => {
  return ioInstance;
};

// Throttling timer map for WebSocket room broadcasts (200ms batching window)
const broadcastTimers: Record<string, NodeJS.Timeout> = {};
const pendingLeaderboards: Record<string, { eventId: string; itemId: string; rankedData: any[] }> = {};

export const bidSocketHandler = (io: Server, socket: Socket) => {
  // Store the io instance globally
  setIoInstance(io);

  // Subscribing to event room & sending role-filtered initial leaderboards
  socket.on('room:join', async ({ eventId }: { eventId: string }) => {
    if (eventId) {
      socket.join(`event:${eventId}`);
      socket.emit('room:joined', { message: `Joined room event:${eventId}` });

      try {
        const token = socket.handshake?.auth?.token;
        let requestingUserId: string | undefined;
        if (token) {
          try {
            const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET as string) as DecodeToken;
            requestingUserId = decoded.userId;
            socket.data.userId = decoded.userId;
          } catch {}
        }

        const itemsRes = await pool.query(`SELECT id FROM items WHERE event_id = $1`, [eventId]);
        const allLeaderboards: Record<string, any[]> = {};

        for (const item of itemsRes.rows) {
          const res = await getLeaderboardService(eventId, item.id, requestingUserId);
          if (res && res.rankedData) {
            allLeaderboards[item.id] = res.rankedData;
          }
        }

        socket.emit('updateLeaderboardAll', {
          eventId,
          leaderboards: allLeaderboards,
        });
      } catch (err) {
        console.error('Error fetching initial event leaderboards on room join:', err);
      }
    }
  });

  // Real-time Bidding Event with Role-Based PII Masking & Throttling
  socket.on(
    'bid:place',
    async (payload: {
      token?: string;
      eventId: string;
      itemId: string;
      amount: number;
    }) => {
      try {
        const { eventId, itemId, amount } = payload;
        const authToken = payload.token || socket.handshake?.auth?.token;

        if (!authToken) {
          return socket.emit('bid:error', {
            status: 401,
            message: 'Unauthorized - Token is required',
          });
        }

        let decoded: DecodeToken;
        try {
          decoded = jwt.verify(
            authToken,
            process.env.ACCESS_TOKEN_SECRET as string
          ) as DecodeToken;
          socket.data.userId = decoded.userId;
        } catch (err) {
          return socket.emit('bid:error', {
            status: 401,
            message: 'Unauthorized - Invalid or expired token',
          });
        }

        // Delegate business logic to bidService
        const result = await placeBidService({
          userId: decoded.userId,
          eventId,
          itemId,
          amount: Number(amount),
        });

        // Emit Success directly to Bidder Socket
        socket.emit('bid:success', {
          status: 200,
          message: 'Bid placed successfully',
          eventId: result.eventId,
          itemId: result.itemId,
          amount: result.amount,
          rank: result.rank,
        });

        // Store latest unmasked leaderboard payload for 200ms throttling
        const throttleKey = `event:${eventId}:item:${itemId}`;
        pendingLeaderboards[throttleKey] = {
          eventId: result.eventId,
          itemId: result.itemId,
          rankedData: result.rawLeaderboard,
        };

        if (!broadcastTimers[throttleKey]) {
          broadcastTimers[throttleKey] = setTimeout(async () => {
            delete broadcastTimers[throttleKey];
            const latestData = pendingLeaderboards[throttleKey];
            delete pendingLeaderboards[throttleKey];

            if (!latestData) return;

            try {
              // Fetch Event Creator ID
              const evRes = await pool.query(`SELECT creator_id FROM events WHERE id = $1`, [latestData.eventId]);
              const creatorId = evRes.rows.length > 0 ? evRes.rows[0].creator_id : null;

              // Broadcast role-filtered payloads to sockets in room
              const roomSockets = await io.in(`event:${latestData.eventId}`).fetchSockets();

              for (const roomSocket of roomSockets) {
                const sUserId = roomSocket.data?.userId;
                const isCreator = Boolean(creatorId && sUserId === creatorId);

                const roleFilteredRankedData = maskLeaderboardForViewer(
                  latestData.rankedData,
                  sUserId,
                  isCreator
                );

                roomSocket.emit('updateLeaderboard', {
                  eventId: latestData.eventId,
                  itemId: latestData.itemId,
                  rankedData: roleFilteredRankedData,
                });
              }
            } catch (bErr) {
              console.error('Error broadcasting throttled leaderboard:', bErr);
            }
          }, 200); // 200ms Throttling Window
        }
      } catch (error: any) {
        if (error instanceof ApiError) {
          return socket.emit('bid:error', {
            status: error.statusCode,
            message: error.message,
          });
        }

        socket.emit('bid:error', {
          status: 500,
          message: 'Internal server error while placing bid',
        });
      }
    }
  );
};
