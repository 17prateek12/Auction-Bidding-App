import { Worker, Job } from 'bullmq';
import { pool } from '../connection/postgresConfig';
import { redis } from '../connection/redisConfig';

import { redisConnection } from '../connection/redisConfig';

export const initFinalizationWorker = () => {
  const worker = new Worker(
    'event-finalization',
    async (job: Job) => {
      const { eventId } = job.data;

      const lockKey = `event:${eventId}:finalizing`;
      // Acquire a lock for 60 seconds
      const gotLock = await redis.set(lockKey, '1', 'EX', 60, 'NX');
      if (gotLock !== 'OK') {
        console.log(`[Worker] Event ${eventId} finalization is already in progress by another worker`);
        return;
      }

      try {
        // Fetch event row
        const eventRes = await pool.query(
          `SELECT * FROM events WHERE id = $1`,
          [eventId]
        );
        if (eventRes.rows.length === 0) {
          console.warn(`[Worker] Event ${eventId} not found in database`);
          return;
        }

        const eventRow = eventRes.rows[0];
        if (eventRow.event_status === 'ended') {
          console.log(`[Worker] Event ${eventId} has already been finalized`);
          return;
        }

        // Update status to 'ended' in database
        await pool.query(
          `UPDATE events SET event_status = 'ended' WHERE id = $1`,
          [eventId]
        );

        // Fetch Items and Bids
        const itemsRes = await pool.query(
          `SELECT * FROM items WHERE event_id = $1`,
          [eventId]
        );
        const bidsRes = await pool.query(
          `SELECT * FROM bids WHERE event_id = $1 ORDER BY amount ASC`,
          [eventId]
        );

        // Save snapshot to entire_events
        await pool.query(
          `
          INSERT INTO entire_events (event_id, event_details, items, bids)
          VALUES ($1, $2, $3, $4)
          ON CONFLICT (event_id) DO NOTHING;
        `,
          [
            eventId,
            JSON.stringify(eventRow),
            JSON.stringify(itemsRes.rows),
            JSON.stringify(bidsRes.rows),
          ]
        );

        console.log(`[Worker] Finalized event ${eventId} and generated snapshot`);

        // Broadcast event ended to connected sockets
        const { getSocket } = require('../sockets/bidSocket');
        const io = getSocket();
        if (io) {
          io.to(`event:${eventId}`).emit('event:ended', { eventId });
          console.log(`[Worker] Broadcasted event:ended to socket room event:${eventId}`);
        }
      } catch (err) {
        console.error(`[Worker] Error finalizing event ${eventId}:`, err);
        throw err;
      } finally {
        // Release the distributed lock
        await redis.del(lockKey);
      }
    },
    {
      connection: redisConnection,
      concurrency: 1, // Single worker thread handles finalization to avoid racing
    }
  );

  worker.on('completed', (job: Job) => {
    console.log(`Event finalization job ${job.id} completed successfully`);
  });

  worker.on('failed', (job: Job | undefined, err: Error) => {
    console.error(`Event finalization job ${job?.id} failed:`, err.message);
  });

  console.log('BullMQ Event Finalization Worker initialized');
};
