import { Queue } from 'bullmq';

const REDIS_HOST = process.env.REDIS_HOST || 'localhost';
const REDIS_PORT = process.env.REDIS_PORT ? parseInt(process.env.REDIS_PORT) : 6782;

const redisConnection = {
  host: REDIS_HOST,
  port: REDIS_PORT,
};

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
