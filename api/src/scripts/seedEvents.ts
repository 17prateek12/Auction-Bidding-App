import { pool, initPostgresDb } from '../connection/postgresConfig';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';

dotenv.config();

export const seedDatabase = async () => {
  console.log('🌱 Starting PostgreSQL Database Seeding...');

  // Ensure DB DDL tables exist
  await initPostgresDb();

  // 1. Seed Main User (17prateek12@gmail.com)
  const email = '17prateek12@gmail.com';
  const plainPassword = 'Prateek@1712';
  const name = 'Prateek Sogani';

  const userCheck = await pool.query(`SELECT * FROM users WHERE email = $1`, [email]);
  let userId: string;

  if (userCheck.rows.length > 0) {
    userId = userCheck.rows[0].id;
    console.log(`✅ User ${email} already exists with ID: ${userId}`);
  } else {
    const regTime = Date.now().toString();
    const salt = await bcrypt.genSalt(10);
    const hashPassword = await bcrypt.hash(plainPassword + regTime, salt);

    const userRes = await pool.query(
      `INSERT INTO users (name, email, password_hash, registration_time) VALUES ($1, $2, $3, $4) RETURNING id`,
      [name, email, hashPassword, regTime]
    );
    userId = userRes.rows[0].id;
    console.log(`✅ Created User ${email} with ID: ${userId}`);
  }

  // 2. Seed Second User (alice@auction.com)
  const aliceEmail = 'alice@auction.com';
  const aliceCheck = await pool.query(`SELECT * FROM users WHERE email = $1`, [aliceEmail]);
  let aliceId: string;

  if (aliceCheck.rows.length > 0) {
    aliceId = aliceCheck.rows[0].id;
  } else {
    const regTime = Date.now().toString();
    const salt = await bcrypt.genSalt(10);
    const hashPassword = await bcrypt.hash('Password@123' + regTime, salt);

    const aliceRes = await pool.query(
      `INSERT INTO users (name, email, password_hash, registration_time) VALUES ($1, $2, $3, $4) RETURNING id`,
      ['Alice Bidder', aliceEmail, hashPassword, regTime]
    );
    aliceId = aliceRes.rows[0].id;
    console.log(`✅ Created User ${aliceEmail} with ID: ${aliceId}`);
  }

  const now = new Date();

  // Helper function to insert an event and its items
  const createSeedEvent = async (
    eventName: string,
    description: string,
    eventStatus: 'active' | 'upcoming' | 'ended',
    startTime: Date,
    endTime: Date,
    columns: string[],
    itemsList: Record<string, string>[]
  ) => {
    // Check if event already exists
    const checkEvent = await pool.query(
      `SELECT id FROM events WHERE name = $1 AND creator_id = $2`,
      [eventName, userId]
    );

    let eventId: string;
    if (checkEvent.rows.length > 0) {
      eventId = checkEvent.rows[0].id;
      // Update status and times
      await pool.query(
        `UPDATE events SET event_status = $1, start_time = $2, end_time = $3 WHERE id = $4`,
        [eventStatus, startTime, endTime, eventId]
      );
      console.log(`🔄 Updated existing event "${eventName}" (${eventStatus})`);
    } else {
      const eventRes = await pool.query(
        `
        INSERT INTO events (creator_id, name, description, start_time, end_time, event_date, event_status, columns)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING id;
      `,
        [
          userId,
          eventName,
          description,
          startTime,
          endTime,
          startTime,
          eventStatus,
          JSON.stringify(columns),
        ]
      );
      eventId = eventRes.rows[0].id;
      console.log(`🎉 Created event "${eventName}" (${eventStatus}) with ID: ${eventId}`);

      // Insert items for the event
      for (const itemData of itemsList) {
        await pool.query(
          `INSERT INTO items (event_id, column_data, created_by) VALUES ($1, $2, $3)`,
          [eventId, JSON.stringify(itemData), userId]
        );
      }

      // Add participant record
      await pool.query(
        `INSERT INTO participants (event_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
        [eventId, aliceId]
      );
    }

    // If event is ended, populate entire_events snapshot for AI Assistant
    if (eventStatus === 'ended') {
      const snapshotCheck = await pool.query(`SELECT id FROM entire_events WHERE event_id = $1`, [eventId]);
      if (snapshotCheck.rows.length === 0) {
        const fetchItems = await pool.query(`SELECT * FROM items WHERE event_id = $1`, [eventId]);
        const snapshotDetails = {
          id: eventId,
          name: eventName,
          description,
          status: 'ended',
          startTime,
          endTime,
        };
        const sampleBids = fetchItems.rows.map((it: any, idx: number) => ({
          item_id: it.id,
          user_id: aliceId,
          user_name: 'Alice Bidder',
          amount: 1500 + idx * 200,
          rank: 1,
        }));

        await pool.query(
          `INSERT INTO entire_events (event_id, event_details, items, bids) VALUES ($1, $2, $3, $4)`,
          [eventId, JSON.stringify(snapshotDetails), JSON.stringify(fetchItems.rows), JSON.stringify(sampleBids)]
        );
        console.log(`📸 Created AI snapshot for ended event "${eventName}"`);
      }
    }
  };

  // 3. Seed 1 Live Event
  const liveStartTime = new Date(now.getTime() - 60 * 60 * 1000); // 1 hour ago
  const liveEndTime = new Date(now.getTime() + 4 * 60 * 60 * 1000); // 4 hours later
  await createSeedEvent(
    'Premium Electronics Reverse Auction',
    'Live competitive reverse auction for high-performance laptops, smartphones, and noise-canceling headphones.',
    'active',
    liveStartTime,
    liveEndTime,
    ['Product Name', 'Quantity', 'Opening Price', 'Category'],
    [
      { 'Product Name': 'MacBook Pro M3 Max 16"', Quantity: '15', 'Opening Price': '$2,499', Category: 'Laptops' },
      { 'Product Name': 'iPhone 15 Pro Max 256GB', Quantity: '30', 'Opening Price': '$1,199', Category: 'Smartphones' },
      { 'Product Name': 'Sony WH-1000XM5 Headphones', Quantity: '50', 'Opening Price': '$399', Category: 'Audio' },
      { 'Product Name': 'iPad Pro 12.9" M2 128GB', Quantity: '20', 'Opening Price': '$1,099', Category: 'Tablets' },
    ]
  );

  // 4. Seed 1 Upcoming Event
  const upcomingStartTime = new Date(now.getTime() + 24 * 60 * 60 * 1000); // Tomorrow
  const upcomingEndTime = new Date(now.getTime() + 48 * 60 * 60 * 1000);
  await createSeedEvent(
    'Industrial Heavy Equipment Fleet Clearance',
    'Upcoming sourcing event for excavators, wheel loaders, and heavy diesel power generators.',
    'upcoming',
    upcomingStartTime,
    upcomingEndTime,
    ['Equipment Name', 'Units Available', 'Reserve Price', 'Manufacturer'],
    [
      { 'Equipment Name': 'Caterpillar 320 Hydraulic Excavator', 'Units Available': '3', 'Reserve Price': '$140,000', Manufacturer: 'CAT' },
      { 'Equipment Name': 'Komatsu WA380 Wheel Loader', 'Units Available': '2', 'Reserve Price': '$95,000', Manufacturer: 'Komatsu' },
      { 'Equipment Name': 'Cummins 500kW Diesel Generator', 'Units Available': '5', 'Reserve Price': '$35,000', Manufacturer: 'Cummins' },
    ]
  );

  // 5. Seed 2 Past Events (Ended)
  const past1StartTime = new Date(now.getTime() - 72 * 60 * 60 * 1000); // 3 days ago
  const past1EndTime = new Date(now.getTime() - 48 * 60 * 60 * 1000); // 2 days ago
  await createSeedEvent(
    'Quarterly Freight Logistics Sourcing Q2',
    'Finalized reverse auction contract for regional freight trucking routes and cargo container shipments.',
    'ended',
    past1StartTime,
    past1EndTime,
    ['Route Description', 'Monthly Shipments', 'Target Cost', 'Service Type'],
    [
      { 'Route Description': 'New York City to Chicago Express Route', 'Monthly Shipments': '40', 'Target Cost': '$2,200', 'Service Type': 'Refrigerated Truck' },
      { 'Route Description': 'Los Angeles to Dallas Highway Freight', 'Monthly Shipments': '60', 'Target Cost': '$1,850', 'Service Type': 'Dry Van 53ft' },
    ]
  );

  const past2StartTime = new Date(now.getTime() - 120 * 60 * 60 * 1000); // 5 days ago
  const past2EndTime = new Date(now.getTime() - 96 * 60 * 60 * 1000); // 4 days ago
  await createSeedEvent(
    'Enterprise IT Infrastructure Server Procurement',
    'Finalized reverse auction for enterprise rack servers, core network switches, and mobile workstations.',
    'ended',
    past2StartTime,
    past2EndTime,
    ['Hardware Item', 'Units Required', 'Max Budget', 'Vendor Specs'],
    [
      { 'Hardware Item': 'Dell PowerEdge R750 Rack Server 2U', 'Units Required': '10', 'Max Budget': '$6,500', 'Vendor Specs': 'Dual Xeon Gold, 256GB RAM' },
      { 'Hardware Item': 'Cisco Catalyst 9300 48-Port Switch', 'Units Required': '8', 'Max Budget': '$4,200', 'Vendor Specs': 'PoE+ UPOE 10G Uplink' },
    ]
  );

  console.log('✨ Database Seeding Completed Successfully!');
};

if (require.main === module) {
  seedDatabase()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('❌ Database Seeding Failed:', err);
      process.exit(1);
    });
}
