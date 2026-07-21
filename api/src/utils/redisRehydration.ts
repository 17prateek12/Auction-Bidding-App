import { pool } from '../connection/postgresConfig';
import { redis } from '../connection/redisConfig';

let isRehydrating = false;

/**
 * Rehydrates Redis Sorted Sets from PostgreSQL bids table.
 * Triggered automatically when Redis reconnects after an outage or service restart.
 */
export const rehydrateRedisCacheFromPostgres = async (): Promise<{ success: boolean; itemCount: number }> => {
  if (isRehydrating) {
    return { success: false, itemCount: 0 };
  }

  isRehydrating = true;
  let rehydratedItems = 0;

  try {
    // 1. Fetch all active events
    const activeEventsRes = await pool.query(
      `SELECT id FROM events WHERE event_status = 'active' OR (start_time <= NOW() AND end_time > NOW())`
    );

    for (const eventRow of activeEventsRes.rows) {
      const eventId = eventRow.id;

      // 2. Fetch all items in event
      const itemsRes = await pool.query(`SELECT id FROM items WHERE event_id = $1`, [eventId]);

      for (const itemRow of itemsRes.rows) {
        const itemId = itemRow.id;
        const bidsKey = `event:${eventId}:item:${itemId}:bids`;

        // 3. Fetch latest bid per user for this item
        const bidsRes = await pool.query(
          `SELECT DISTINCT ON (user_id) user_id, amount
           FROM bids
           WHERE event_id = $1 AND item_id = $2
           ORDER BY user_id, created_at DESC`,
          [eventId, itemId]
        );

        if (bidsRes.rows.length > 0) {
          const pipeline = redis.pipeline();
          // Clear stale key if present
          pipeline.del(bidsKey);

          for (const bidRow of bidsRes.rows) {
            pipeline.zadd(bidsKey, parseFloat(bidRow.amount), bidRow.user_id);
          }

          await pipeline.exec();
          rehydratedItems++;
        }
      }
    }

    if (rehydratedItems > 0) {
      console.log(`✨ Successfully rehydrated Redis cache from PostgreSQL for ${rehydratedItems} active items`);
    }
  } catch (err) {
    console.error('Error rehydrating Redis cache from PostgreSQL:', err);
  } finally {
    isRehydrating = false;
  }

  return { success: true, itemCount: rehydratedItems };
};
