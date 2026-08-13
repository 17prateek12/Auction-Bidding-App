import { pool, initPostgresDb } from '../connection/postgresConfig';
import { scheduleEventFinalization } from '../workers/finalizationQueue';

export const backfillEvents = async () => {
  await initPostgresDb();

  const now = new Date();
  
  // Find all active and upcoming events
  const res = await pool.query(
    `SELECT id, name, end_time FROM events WHERE event_status IN ('active', 'upcoming')`
  );

  console.log(`[Backfill] Found ${res.rowCount} pre-existing active/upcoming events to schedule...`);

  for (const row of res.rows) {
    const delayMs = new Date(row.end_time).getTime() - Date.now();
    if (delayMs > 0) {
      await scheduleEventFinalization(row.id, delayMs);
      console.log(`- Scheduled finalization for event "${row.name}" (${row.id}) in ${(delayMs / 1000).toFixed(0)}s`);
    } else {
      console.log(`- Event "${row.name}" (${row.id}) end_time has already passed. Skipping backfill.`);
    }
  }

  console.log(`✅ Backfill completed successfully!`);
};

if (require.main === module) {
  backfillEvents()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Failed to backfill events:', err);
      process.exit(1);
    });
}
