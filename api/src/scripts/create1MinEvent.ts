import { pool, initPostgresDb } from '../connection/postgresConfig';

export const create1MinEvent = async () => {
  await initPostgresDb();

  const now = new Date();
  const startTime = now;
  const endTime = new Date(now.getTime() + 1 * 60 * 1000); // 1 minute duration from right now!

  const res = await pool.query(
    `UPDATE events 
     SET start_time = $1, end_time = $2, event_status = 'active', event_date = $1 
     WHERE event_status = 'active' OR name LIKE '%Laptop Sourcing%' OR name LIKE '%Electronics%'
     RETURNING id, name, start_time, end_time`,
    [startTime, endTime]
  );

  console.log(`\n=============================================================`);
  console.log(`⏱️ 1-MINUTE RAPID BIDDING EVENT ACTIVATED!`);
  console.log(`=============================================================`);
  console.log(`Starts: ${startTime.toLocaleTimeString()}`);
  console.log(`Ends:   ${endTime.toLocaleTimeString()}`);
  console.log(`-------------------------------------------------------------`);

  res.rows.forEach((row) => {
    console.log(`🔥 Active Event: "${row.name}"`);
    console.log(`   ID: ${row.id}`);
    console.log(`   End Time: ${new Date(row.end_time).toLocaleTimeString()}`);
  });
  console.log(`=============================================================\n`);
};

if (require.main === module) {
  create1MinEvent()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Failed to create 1-minute event:', err);
      process.exit(1);
    });
}
