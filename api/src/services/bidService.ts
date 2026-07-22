import { pool } from '../connection/postgresConfig';
import { ApiError } from '../utils/ApiError';
import { redis } from '../connection/redisConfig';
import { getSocket } from '../sockets/bidSocket';

// Reusable Leaderboard Viewer Masking Function for Security & Privacy Compliance
export const maskLeaderboardForViewer = (
  rankedData: any[],
  requestingUserId?: string,
  isCreator: boolean = false
) => {
  if (!Array.isArray(rankedData)) return [];

  return rankedData.map((bid) => {
    const isSelf = Boolean(requestingUserId && bid.userId === requestingUserId);

    // Creators view all details; Bidders see only their own amounts/names, with competitors masked
    if (isCreator || isSelf) {
      return {
        userId: bid.userId,
        amount: bid.amount !== null ? parseFloat(bid.amount) : null,
        rank: parseInt(bid.rank, 10),
        userName: bid.userName || 'Bidder',
        userEmail: bid.userEmail || '',
      };
    } else {
      return {
        userId: 'masked',
        amount: null,
        rank: parseInt(bid.rank, 10),
        userName: 'Competitor',
        userEmail: '',
      };
    }
  });
};

export const placeBidService = async ({
  userId,
  eventId,
  itemId,
  amount,
}: {
  userId: string;
  eventId: string;
  itemId: string;
  amount: number;
}) => {
  if (!userId || !eventId || !itemId || amount === undefined) {
    throw new ApiError(400, 'All bid placement parameters are required');
  }

  // 1. Fetch Event & Item Details (Validate creator is not bidding, event is active)
  const eventRes = await pool.query(
    `SELECT event_status, creator_id FROM events WHERE id = $1`,
    [eventId]
  );

  if (eventRes.rows.length === 0) {
    throw new ApiError(404, 'Event not found');
  }

  const event = eventRes.rows[0];

  if (event.creator_id === userId) {
    throw new ApiError(403, 'Event creators are not allowed to place bids');
  }

  if (event.event_status !== 'active') {
    throw new ApiError(400, 'Bidding is only allowed on active events');
  }

  const bidsKey = `event:${eventId}:item:${itemId}:bids`;
  let rankedData: Array<{ userId: string; amount: number | null; rank: number; userName?: string; userEmail?: string }> = [];

  // 2. Atomic Redis placing check with Outage/Down Fallback protection (Fail-Closed)
  try {
    // Check if new bid is strictly lower than existing bid ("Always Improve" rule)
    const currentScore = await redis.zscore(bidsKey, userId);
    if (currentScore !== null && amount >= parseFloat(currentScore)) {
      throw new ApiError(400, 'Bids must be strictly lower than your current best bid');
    }

    // Write to Redis Cache atomically
    await redis.zadd(bidsKey, amount, userId);

    // Retrieve full updated Redis Leaderboard
    const leaderboardRaw = await redis.zrange(bidsKey, 0, -1, 'WITHSCORES');
    if (leaderboardRaw && leaderboardRaw.length > 0) {
      for (let i = 0; i < leaderboardRaw.length; i += 2) {
        rankedData.push({
          userId: leaderboardRaw[i],
          amount: parseFloat(leaderboardRaw[i + 1]),
          rank: Math.floor(i / 2) + 1,
        });
      }
    }
  } catch (redisErr: any) {
    // If Redis is offline/unreachable, do NOT fallback to raw writes: Bidding pauses gracefully
    if (redisErr instanceof ApiError) throw redisErr;
    console.error('Redis connection outage during placeBidService. Bidding paused.', redisErr);
    throw new ApiError(503, 'Bidding is temporarily paused — please try again shortly');
  }

  // 3. Queue Background Job to write-behind to PostgreSQL (Single Source of Truth)
  const myRankObj = rankedData.find((b) => b.userId === userId);
  const myRank = myRankObj ? myRankObj.rank : 1;

  try {
    const { getQueue } = require('../utils/bullmqQueue');
    const bidQueue = getQueue();
    await bidQueue.add('sync-bid-to-pg', {
      eventId,
      itemId,
      userId,
      amount,
      rank: myRank,
    }, {
      removeOnComplete: true,
      removeOnFail: false,
    });
  } catch (qErr) {
    console.error('BullMQ job dispatch failed, falling back to direct write-through:', qErr);
    // Fallback to write-through in case queue system is degraded
    await pool.query(
      `
      INSERT INTO bids (event_id, item_id, user_id, amount, rank)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (event_id, item_id, user_id)
      DO UPDATE SET amount = EXCLUDED.amount, rank = EXCLUDED.rank;
    `,
      [eventId, itemId, userId, amount, myRank]
    );
  }

  // 4. Enrich Leaderboard usernames
  const userIds = rankedData.map((d) => d.userId);
  let userMap = new Map<string, any>();
  if (userIds.length > 0) {
    try {
      const usersRes = await pool.query(
        `SELECT id, name, email FROM users WHERE id = ANY($1::uuid[])`,
        [userIds]
      );
      userMap = new Map(usersRes.rows.map((u) => [u.id, u]));
    } catch (err) {
      console.error('Error enriching user names in placeBidService:', err);
    }
  }

  const enrichedData = rankedData.map((d) => {
    const u = userMap.get(d.userId);
    return {
      ...d,
      userName: u?.name || u?.email || 'Bidder',
      userEmail: u?.email || '',
    };
  });

  // 5. Emit real-time updates via Socket.IO Throttled Broadcast Engine
  const io = getSocket();
  if (io) {
    const { scheduleLeaderboardBroadcast } = require('../sockets/bidSocket');
    scheduleLeaderboardBroadcast(eventId, itemId, enrichedData);
  }

  return {
    eventId,
    itemId,
    amount,
    rank: myRank,
    rawLeaderboard: enrichedData,
  };
};

export const getLeaderboardService = async (eventId: string, itemId?: string, requestingUserId?: string) => {
  if (!eventId) {
    throw new ApiError(400, 'eventId is required');
  }

  // Fetch Event Creator to determine Role
  const eventRes = await pool.query(`SELECT creator_id FROM events WHERE id = $1`, [eventId]);
  if (eventRes.rows.length === 0) {
    throw new ApiError(404, 'Event not found');
  }
  const isCreator = Boolean(requestingUserId && eventRes.rows[0].creator_id === requestingUserId);

  if (itemId) {
    // Single Item Leaderboard Fetch
    const bidsKey = `event:${eventId}:item:${itemId}:bids`;
    let rankedData: Array<{ userId: string; amount: number | null; rank: number; userName?: string; userEmail?: string }> = [];

    try {
      const leaderboardRaw = await redis.zrange(bidsKey, 0, -1, 'WITHSCORES');
      if (leaderboardRaw && leaderboardRaw.length > 0) {
        for (let i = 0; i < leaderboardRaw.length; i += 2) {
          rankedData.push({
            userId: leaderboardRaw[i],
            amount: parseFloat(leaderboardRaw[i + 1]),
            rank: Math.floor(i / 2) + 1,
          });
        }
      }
    } catch (err) {
      console.error('Redis error during leaderboard fetch:', err);
    }

    if (rankedData.length === 0) {
      const dbBids = await pool.query(
        `SELECT 
           b.user_id, 
           b.amount, 
           ROW_NUMBER() OVER (ORDER BY b.amount ASC) as rank 
         FROM bids b 
         WHERE b.event_id = $1 AND b.item_id = $2 
         ORDER BY b.amount ASC`,
        [eventId, itemId]
      );

      rankedData = dbBids.rows.map((row) => ({
        userId: row.user_id,
        amount: parseFloat(row.amount),
        rank: parseInt(row.rank, 10),
      }));
    }

    const userIds = rankedData.map((d) => d.userId);
    let userMap = new Map<string, any>();

    if (userIds.length > 0) {
      try {
        const usersRes = await pool.query(
          `SELECT id, name, email FROM users WHERE id = ANY($1::uuid[])`,
          [userIds]
        );
        userMap = new Map(usersRes.rows.map((u) => [u.id, u]));
      } catch (err) {
        console.error('Error enriching user names in getLeaderboardService:', err);
      }
    }

    const enrichedData = rankedData.map((d) => {
      const u = userMap.get(d.userId);
      return {
        ...d,
        userName: u?.name || u?.email || 'Bidder',
        userEmail: u?.email || '',
      };
    });

    const roleFilteredData = maskLeaderboardForViewer(enrichedData, requestingUserId, isCreator);

    return {
      eventId,
      itemId,
      isCreator,
      rankedData: roleFilteredData,
    };
  } else {
    // Bulk Event Leaderboard: Query all bids for all items in a single query
    const dbBids = await pool.query(
      `SELECT 
         b.item_id, 
         b.user_id, 
         b.amount, 
         u.name as user_name, 
         u.email as user_email,
         ROW_NUMBER() OVER (PARTITION BY b.item_id ORDER BY b.amount ASC) as rank 
       FROM bids b
       JOIN users u ON b.user_id = u.id
       WHERE b.event_id = $1
       ORDER BY b.item_id, rank`,
      [eventId]
    );

    const leaderboards: Record<string, any[]> = {};

    dbBids.rows.forEach((row) => {
      const itId = row.item_id;
      if (!leaderboards[itId]) {
        leaderboards[itId] = [];
      }

      leaderboards[itId].push({
        userId: row.user_id,
        amount: parseFloat(row.amount),
        rank: parseInt(row.rank, 10),
        userName: row.user_name || 'Bidder',
        userEmail: row.user_email || '',
      });
    });

    // Apply role-based privacy masking to all item leaderboards
    const maskedLeaderboards: Record<string, any[]> = {};
    Object.entries(leaderboards).forEach(([itId, rankedData]) => {
      maskedLeaderboards[itId] = maskLeaderboardForViewer(rankedData, requestingUserId, isCreator);
    });

    return {
      eventId,
      isCreator,
      leaderboards: maskedLeaderboards,
    };
  }
};

export const getUserRankService = async (userId: string, eventId: string) => {
  if (!eventId || !userId) {
    throw new ApiError(400, 'eventId and userId are required');
  }

  // Optimized single partition window query across all items in the event
  const rankRes = await pool.query(
    `SELECT 
       b.item_id as "itemId", 
       b.amount, 
       sub.rank
     FROM bids b
     JOIN (
       SELECT 
         id, 
         ROW_NUMBER() OVER (PARTITION BY item_id ORDER BY amount ASC) as rank
       FROM bids
       WHERE event_id = $1
     ) sub ON b.id = sub.id
     WHERE b.user_id = $2 AND b.event_id = $1`,
    [eventId, userId]
  );

  const userBids = rankRes.rows.map((row) => ({
    itemId: row.itemId,
    amount: parseFloat(row.amount),
    rank: parseInt(row.rank, 10),
  }));

  return {
    userId,
    eventId,
    userBids,
  };
};
