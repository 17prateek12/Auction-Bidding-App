import { pool, initPostgresDb } from '../connection/postgresConfig';

export const extendLiveEvents = async () => {
  await initPostgresDb();

  const now = new Date();
  const startTime = new Date(now.getTime() - 30 * 60 * 1000); // 30 mins ago
  const endTime = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours in future

  const res = await pool.query(
    `UPDATE events 
     SET start_time = $1, end_time = $2, event_status = 'active' 
     WHERE event_status = 'active' OR name LIKE '%Laptop Sourcing%'
     RETURNING id, name, start_time, end_time`,
    [startTime, endTime]
  );

  console.log(`✅ Updated ${res.rowCount} live events to stay active for 24 hours!`);
  res.rows.forEach((row) => {
    console.log(`- Event "${row.name}" (${row.id}): Ends at ${row.end_time}`);
  });
};

if (require.main === module) {
  extendLiveEvents()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Failed to extend live events:', err);
      process.exit(1);
    });
}
