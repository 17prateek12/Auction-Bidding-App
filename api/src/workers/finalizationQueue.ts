import { Queue } from 'bullmq';

import { redisConnection } from '../connection/redisConfig';

export const finalizationQueue = new Queue('event-finalization', {
  connection: redisConnection,
});

export const scheduleEventFinalization = async (eventId: string, delayMs: number) => {
  if (delayMs <= 0) return;
  
  try {
    await finalizationQueue.add(
      'finalize-event',
      { eventId },
      {
        delay: delayMs,
        jobId: `finalize-${eventId}`,
        attempts: 5,
        backoff: { type: 'exponential', delay: 2000 },
        removeOnComplete: true,
        removeOnFail: false, // Keep failed jobs for diagnostic visibility
      }
    );
    console.log(`Scheduled finalization for event ${eventId} in ${delayMs}ms`);
  } catch (error) {
    console.error(`Failed to schedule finalization for event ${eventId}:`, error);
  }
};

export const extendEventFinalization = async (eventId: string, extensionMs: number) => {
  try {
    const job = await finalizationQueue.getJob(`finalize-${eventId}`);
    if (job) {
      const isDelayed = await job.isDelayed();
      if (isDelayed) {
        await job.changeDelay(extensionMs);
        console.log(`Extended finalization for event ${eventId} by ${extensionMs}ms`);
      }
    }
  } catch (error) {
    console.error(`Failed to extend finalization for event ${eventId}:`, error);
  }
};
