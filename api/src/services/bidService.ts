import { pool } from '../connection/postgresConfig';
import { placeBidAtomically } from '../utils/luaScripts';
import { redis } from '../connection/redisConfig';
import { ApiError } from '../utils/ApiError';
import { addBidToSyncQueue } from '../workers/bidQueue';

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
  if (!eventId || !itemId || !amount || amount <= 0) {
    throw new ApiError(400, 'eventId, itemId, and valid positive amount are required');
  }

  const eventRes = await pool.query(
    `SELECT * FROM events WHERE id = $1`,
    [eventId]
  );

  if (eventRes.rows.length === 0) {
    throw new ApiError(404, 'Event not found');
  }

  const event = eventRes.rows[0];

  if (event.creator_id === userId) {
    throw new ApiError(403, 'Event creator cannot participate or bid in their own event');
  }

  const now = new Date();
  if (now < new Date(event.start_time)) {
    throw new ApiError(400, 'Event has not started yet');
  }
  if (now >= new Date(event.end_time)) {
    throw new ApiError(400, 'Event has ended');
  }

  const bidsKey = `event:${eventId}:item:${itemId}:bids`;
  let luaResult: any;

  try {
    luaResult = await placeBidAtomically(bidsKey, userId, amount);
  } catch (err: any) {
    if (err instanceof ApiError) throw err;
    console.error('⚠️ Redis outage detected during bid placement:', err?.message || err);
    throw new ApiError(503, 'Bidding is temporarily paused due to cache maintenance — please try again shortly');
  }

  const { success, rankOrMessage } = luaResult;

  if (!success) {
    throw new ApiError(400, rankOrMessage);
  }

  const newRank = parseInt(rankOrMessage, 10);

  // Format ranked leaderboard from Redis (ZRANGE = lowest bid first for reverse auction)
  let leaderboardRaw: string[] = [];
  try {
    leaderboardRaw = await redis.zrange(bidsKey, 0, -1, 'WITHSCORES');
  } catch (err) {
    console.error('Redis error fetching ZRANGE:', err);
  }

  const rankedData: Array<{ userId: string; amount: number; rank: number; userName?: string; userEmail?: string }> = [];
  for (let i = 0; i < leaderboardRaw.length; i += 2) {
    rankedData.push({
      userId: leaderboardRaw[i],
      amount: parseFloat(leaderboardRaw[i + 1]),
      rank: Math.floor(i / 2) + 1,
    });
  }

  // Enrich with user names and emails for live leaderboard display
  const userIds = rankedData.map((d) => d.userId);
  if (userIds.length > 0) {
    try {
      const usersRes = await pool.query(
        `SELECT id, name, email FROM users WHERE id = ANY($1::uuid[])`,
        [userIds]
      );
      const userMap = new Map(usersRes.rows.map((u) => [u.id, u]));
      rankedData.forEach((d) => {
        const u = userMap.get(d.userId);
        d.userName = u?.name || u?.email || 'Bidder';
        d.userEmail = u?.email || '';
      });
    } catch (err) {
      console.error('Error enriching user names:', err);
    }
  }

  // Enqueue job to BullMQ Write-Behind Queue for async PostgreSQL persistence
  addBidToSyncQueue({
    eventId,
    itemId,
    userId,
    amount,
    rank: newRank,
  }).catch((err) => console.error('Error adding bid job to sync queue:', err));

  return {
    eventId,
    itemId,
    amount,
    rank: newRank,
    rankedData,
  };
};

export const getLeaderboardService = async (eventId: string, itemId: string, requestingUserId?: string) => {
  if (!eventId || !itemId) {
    throw new ApiError(400, 'eventId and itemId are required');
  }

  // Fetch Event Creator to determine Role
  const eventRes = await pool.query(`SELECT creator_id FROM events WHERE id = $1`, [eventId]);
  const isCreator = Boolean(eventRes.rows.length > 0 && requestingUserId && eventRes.rows[0].creator_id === requestingUserId);

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

  // PostgreSQL Fallback (Dynamic SQL Window Function for accurate reverse auction ranks)
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

  // Enrich & Role-Filter for PII & Competitor Bid Privacy
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

  const roleFilteredData = rankedData.map((d) => {
    const u = userMap.get(d.userId);
    const isSelf = Boolean(requestingUserId && d.userId === requestingUserId);

    if (isCreator || isSelf) {
      // Event Creator & Self see full identity and exact amount
      return {
        userId: d.userId,
        amount: d.amount,
        rank: d.rank,
        userName: u?.name || u?.email || 'Bidder',
        userEmail: u?.email || '',
      };
    } else {
      // Competitors see privacy-masked entry (no PII, no competitor bid price)
      return {
        userId: 'masked',
        amount: null,
        rank: d.rank,
        userName: 'Competitor',
        userEmail: '',
      };
    }
  });

  return {
    eventId,
    itemId,
    isCreator,
    rankedData: roleFilteredData,
  };
};

export const getUserRankService = async (userId: string, eventId: string) => {
  if (!eventId || !userId) {
    throw new ApiError(400, 'eventId and userId are required');
  }

  const itemsRes = await pool.query(
    `SELECT id FROM items WHERE event_id = $1`,
    [eventId]
  );

  const userBids: Array<{ itemId: string; amount: number | null; rank: number | null }> = [];

  for (const item of itemsRes.rows) {
    const itemIdStr = item.id;
    const bidsKey = `event:${eventId}:item:${itemIdStr}:bids`;

    let rank: number | null = null;
    let amount: number | null = null;

    try {
      const redisRank = await redis.zrank(bidsKey, userId);
      const redisScore = await redis.zscore(bidsKey, userId);

      if (redisRank !== null && redisScore !== null) {
        rank = redisRank + 1;
        amount = parseFloat(redisScore);
      }
    } catch (err) {
      console.error('Redis error while fetching user rank:', err);
    }

    if (rank === null) {
      const bidRes = await pool.query(
        `SELECT sub.amount, sub.rank FROM (
           SELECT user_id, amount, ROW_NUMBER() OVER (ORDER BY amount ASC) as rank
           FROM bids WHERE event_id = $1 AND item_id = $2
         ) sub WHERE sub.user_id = $3`,
        [eventId, itemIdStr, userId]
      );

      if (bidRes.rows.length > 0) {
        amount = parseFloat(bidRes.rows[0].amount);
        rank = parseInt(bidRes.rows[0].rank, 10);
      }
    }

    userBids.push({
      itemId: itemIdStr,
      amount,
      rank,
    });
  }

  return {
    userId,
    eventId,
    userBids,
  };
};
