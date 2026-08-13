import { initPostgresDb } from '../connection/postgresConfig';
import { createEventService } from '../services/eventService';

export const createTestEvent = async () => {
  await initPostgresDb();

  const start = new Date('2026-08-13T23:20:00+05:30');
  const end = new Date('2026-08-13T23:22:00+05:30');

  console.log(`Creating test event starting at: ${start.toISOString()} and ending at: ${end.toISOString()}...`);

  const result = await createEventService({
    creatorId: '6a2e60d2-75c9-6b5c-4e7d-aaab00000000',
    name: '2-Min Live Test Event (23:20 IST)',
    description: 'A 2-minute event to test BullMQ finalization and anti-sniping',
    startTime: start,
    endTime: end,
    eventDate: start,
    columns: ['Item Name', 'Quantity', 'Target Price'],
    rows: [
      { 'Item Name': 'Test Laptop Pro', 'Quantity': 5, 'Target Price': 1000 },
      { 'Item Name': 'Test Ultra Monitor', 'Quantity': 10, 'Target Price': 300 }
    ],
  });

  console.log(`✅ Event successfully created with ID: ${result.event.id}`);
  console.log(`Scheduled finalization for end time: ${end.toISOString()}`);
};

createTestEvent()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Failed to create test event:', err);
    process.exit(1);
  });
