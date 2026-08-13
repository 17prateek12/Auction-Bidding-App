import { Queue } from 'bullmq';

import { redisConnection } from '../connection/redisConfig';

export const bidQueue = new Queue('bid-sync-queue', {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000,
    },
    removeOnComplete: 100,
    removeOnFail: 500,
  },
});

export const addBidToSyncQueue = async (bidData: {
  eventId: string;
  itemId: string;
  userId: string;
  amount: number;
  rank: number;
}) => {
  try {
    // BullMQ custom jobId cannot contain colons (:). Use underscores instead.
    const cleanJobId = `bid_${bidData.eventId}_${bidData.itemId}_${bidData.userId}_${Date.now()}`;
    await bidQueue.add('syncBid', bidData, {
      jobId: cleanJobId,
    });
  } catch (error) {
    console.error('Error enqueuing bid sync job:', error);
  }
};
