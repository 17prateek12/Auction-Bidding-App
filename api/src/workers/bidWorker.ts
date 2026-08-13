import { Worker, Job } from 'bullmq';
import { pool } from '../connection/postgresConfig';

import { redisConnection } from '../connection/redisConfig';

export const initBidWorker = () => {
  const worker = new Worker(
    'bid-sync-queue',
    async (job: Job) => {
      const { eventId, itemId, userId, amount, rank } = job.data;

      // Write-Behind to PostgreSQL (Single Source of Record)
      try {
        await pool.query(
          `
          INSERT INTO bids (event_id, item_id, user_id, amount, rank)
          VALUES ($1, $2, $3, $4, $5)
          ON CONFLICT (event_id, item_id, user_id)
          DO UPDATE SET amount = EXCLUDED.amount, rank = EXCLUDED.rank;
        `,
          [eventId, itemId, userId, amount, rank]
        );
      } catch (pgErr) {
        console.error('PostgreSQL write-behind error for job', job.id, pgErr);
        throw pgErr;
      }
    },
    {
      connection: redisConnection,
      concurrency: 5,
    }
  );

  worker.on('completed', (job: Job) => {
    console.log(`Bid sync job ${job.id} completed successfully`);
  });

  worker.on('failed', (job: Job | undefined, err: Error) => {
    console.error(`Bid sync job ${job?.id} failed with error:`, err.message);
  });

  console.log('BullMQ PostgreSQL Bid Write-Behind Worker initialized');
};
