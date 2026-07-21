import { pool, initPostgresDb } from '../connection/postgresConfig';

export const reset5MinEvents = async () => {
  await initPostgresDb();

  const now = new Date();
  const startTime = new Date(now.getTime() - 2 * 60 * 1000); // 2 mins ago today
  const endTime = new Date(now.getTime() + 3 * 60 * 1000); // 3 mins from now today (Total 5 mins duration!)

  const res = await pool.query(
    `UPDATE events 
     SET start_time = $1, end_time = $2, event_status = 'active', event_date = $1 
     WHERE event_status = 'active' OR name LIKE '%Laptop Sourcing%' OR name LIKE '%Electronics%'
     RETURNING id, name, start_time, end_time`,
    [startTime, endTime]
  );

  console.log(`⏱️ Reset ${res.rowCount} test events to 5-minute duration today (${startTime.toLocaleTimeString()} to ${endTime.toLocaleTimeString()})!`);
  res.rows.forEach((row) => {
    console.log(`- Event "${row.name}" (${row.id}): Ends at ${new Date(row.end_time).toLocaleTimeString()}`);
  });
};

if (require.main === module) {
  reset5MinEvents()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Failed to reset test events:', err);
      process.exit(1);
    });
}
