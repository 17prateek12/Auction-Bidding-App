import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { DecodeToken } from '../interface/interface';
import { placeBidService, getLeaderboardService } from '../services/bidService';
import { pool } from '../connection/postgresConfig';
import { ApiError } from '../utils/ApiError';

export const bidSocketHandler = (io: Server, socket: Socket) => {
  // Subscribing to event room & sending initial full leaderboards
  socket.on('room:join', async ({ eventId }: { eventId: string }) => {
    if (eventId) {
      socket.join(`event:${eventId}`);
      console.log(`Socket ${socket.id} joined room event:${eventId}`);
      socket.emit('room:joined', { message: `Joined room event:${eventId}` });

      try {
        const itemsRes = await pool.query(`SELECT id FROM items WHERE event_id = $1`, [eventId]);
        const allLeaderboards: Record<string, any[]> = {};

        for (const item of itemsRes.rows) {
          const res = await getLeaderboardService(eventId, item.id);
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

  // Real-time Bidding Event
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

        // Emit Success to Client
        socket.emit('bid:success', {
          status: 200,
          message: 'Bid placed successfully',
          eventId: result.eventId,
          itemId: result.itemId,
          amount: result.amount,
          rank: result.rank,
        });

        // Broadcast updated leaderboard to ALL room members
        io.to(`event:${eventId}`).emit('updateLeaderboard', {
          eventId: result.eventId,
          itemId: result.itemId,
          rankedData: result.rankedData,
        });
      } catch (error: any) {
        console.error('Error placing bid via socket:', error);

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
