import { pool, initPostgresDb } from '../connection/postgresConfig';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import { placeBidService } from '../services/bidService';
import { askEventAiService } from '../services/aiService';

dotenv.config();

export const runE2ETestFlow = async () => {
  console.log('🚀 Starting Concurrent Bidding E2E Script (Creator: Mansi Jain + 5 Concurrent Participants)...');

  await initPostgresDb();

  // Helper to register/seed users
  const ensureUser = async (email: string, name: string, pass: string) => {
    const check = await pool.query(`SELECT * FROM users WHERE email = $1`, [email]);
    if (check.rows.length > 0) {
      console.log(`✅ User ${email} exists (${check.rows[0].id})`);
      return check.rows[0].id;
    }
    const regTime = Date.now().toString();
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(pass + regTime, salt);
    const res = await pool.query(
      `INSERT INTO users (name, email, password_hash, registration_time) VALUES ($1, $2, $3, $4) RETURNING id`,
      [name, email, hash, regTime]
    );
    console.log(`🎉 Created User ${email} (${res.rows[0].id})`);
    return res.rows[0].id;
  };

  // 1. Creator: Mansi Jain
  const mansiCreatorId = await ensureUser('mansi1517@gmail.com', 'Mansi Jain', 'Mansi@123');

  // 2. 5 Bidding Participants
  const prateekId = await ensureUser('17prateek12@gmail.com', 'Prateek Sogani', 'Prateek@1712');
  const aliceId = await ensureUser('alice@auction.com', 'Alice Bidder', 'Password@123');
  const yashuId = await ensureUser('yashu@gmail.com', 'Yashu Supplier', 'Yashu@123');
  const rohitId = await ensureUser('rohit@gmail.com', 'Rohit Sharma', 'Rohit@123');
  const nehaId = await ensureUser('neha@gmail.com', 'Neha Verma', 'Neha@123');

  const now = new Date();
  const startTime = new Date(now.getTime() - 10 * 60 * 1000); // 10 mins ago
  const endTime = new Date(now.getTime() + 10 * 60 * 1000); // 10 mins later (Active Live)

  const columns = ['Laptop Model', 'Quantity', 'Target Opening Price', 'RAM & Specs'];
  const laptopItems = [
    { 'Laptop Model': 'Apple MacBook Pro M3 Max 16"', Quantity: '20', 'Target Opening Price': '$2,499', 'RAM & Specs': '36GB RAM, 1TB SSD' },
    { 'Laptop Model': 'Dell XPS 15 9530', Quantity: '15', 'Target Opening Price': '$1,899', 'RAM & Specs': '32GB RAM, RTX 4060' },
    { 'Laptop Model': 'Lenovo ThinkPad X1 Carbon Gen 11', Quantity: '30', 'Target Opening Price': '$1,650', 'RAM & Specs': '16GB RAM, i7-1370P' },
    { 'Laptop Model': 'HP Spectre x360 16"', Quantity: '10', 'Target Opening Price': '$1,599', 'RAM & Specs': '16GB RAM, 512GB SSD' },
    { 'Laptop Model': 'Asus ROG Zephyrus G16', Quantity: '12', 'Target Opening Price': '$1,999', 'RAM & Specs': '32GB RAM, RTX 4070' },
    { 'Laptop Model': 'Razer Blade 16 Gaming Laptop', Quantity: '8', 'Target Opening Price': '$2,799', 'RAM & Specs': '32GB RAM, RTX 4080' },
    { 'Laptop Model': 'Acer Predator Helios 16', Quantity: '15', 'Target Opening Price': '$1,499', 'RAM & Specs': '16GB RAM, RTX 4060' },
    { 'Laptop Model': 'MSI Raider GE78 HX', Quantity: '10', 'Target Opening Price': '$2,299', 'RAM & Specs': '32GB RAM, RTX 4080' },
    { 'Laptop Model': 'Microsoft Surface Laptop Studio 2', Quantity: '14', 'Target Opening Price': '$2,099', 'RAM & Specs': '32GB RAM, RTX 4050' },
    { 'Laptop Model': 'LG Gram 17 Super-Lightweight', Quantity: '25', 'Target Opening Price': '$1,399', 'RAM & Specs': '16GB RAM, 1TB SSD' },
  ];

  // 3. Create Event owned by Mansi Jain
  const eventName = 'Global Enterprise Laptop Sourcing 2026';
  const checkEvent = await pool.query(`SELECT id FROM events WHERE name = $1 AND creator_id = $2`, [eventName, mansiCreatorId]);

  let eventId: string;
  if (checkEvent.rows.length > 0) {
    eventId = checkEvent.rows[0].id;
    await pool.query(`UPDATE events SET event_status = 'active', start_time = $1, end_time = $2 WHERE id = $3`, [startTime, endTime, eventId]);
    console.log(`🔄 Updated existing event "${eventName}" (${eventId})`);
  } else {
    const eventRes = await pool.query(
      `INSERT INTO events (creator_id, name, description, start_time, end_time, event_date, event_status, columns)
       VALUES ($1, $2, $3, $4, $5, $6, 'active', $7) RETURNING id`,
      [mansiCreatorId, eventName, 'Reverse auction event created by Mansi Jain for 10 laptop models.', startTime, endTime, startTime, JSON.stringify(columns)]
    );
    eventId = eventRes.rows[0].id;
    console.log(`🎉 Created Event "${eventName}" by Mansi Jain (${eventId})`);

    for (const itemData of laptopItems) {
      await pool.query(`INSERT INTO items (event_id, column_data, created_by) VALUES ($1, $2, $3)`, [eventId, JSON.stringify(itemData), mansiCreatorId]);
    }
  }

  // Fetch created items
  const itemsRes = await pool.query(`SELECT id FROM items WHERE event_id = $1 ORDER BY created_at ASC`, [eventId]);
  const createdItems = itemsRes.rows;

  console.log(`💻 Found ${createdItems.length} items. Simulating CONCURRENT bidding by 5 participants...`);

  // 4. Concurrent Bidding Simulation using Promise.all()
  const basePrices = [2400, 1800, 1550, 1500, 1900, 2700, 1400, 2200, 2000, 1300];

  for (let idx = 0; idx < createdItems.length; idx++) {
    const item = createdItems[idx];
    const base = basePrices[idx] || 1500;

    // Fire 5 participant bids simultaneously via Promise.all()
    await Promise.all([
      placeBidService({ userId: prateekId, eventId, itemId: item.id, amount: base - 20 }),
      placeBidService({ userId: aliceId, eventId, itemId: item.id, amount: base - 50 }),
      placeBidService({ userId: yashuId, eventId, itemId: item.id, amount: base - 80 }),
      placeBidService({ userId: rohitId, eventId, itemId: item.id, amount: base - 120 }),
      placeBidService({ userId: nehaId, eventId, itemId: item.id, amount: base - 200 }), // Winning Rank #1
    ]);
  }

  console.log('⚡ Concurrent Bidding Simulation Completed Successfully across all 5 participants & 10 items!');

  // 5. Populate entire_events snapshot for AI Assistant
  const snapshotCheck = await pool.query(`SELECT id FROM entire_events WHERE event_id = $1`, [eventId]);
  if (snapshotCheck.rows.length === 0) {
    const fetchItems = await pool.query(`SELECT * FROM items WHERE event_id = $1`, [eventId]);
    const fetchBids = await pool.query(`SELECT * FROM bids WHERE event_id = $1 ORDER BY amount ASC`, [eventId]);
    const snapshotDetails = {
      id: eventId,
      name: eventName,
      description: 'Reverse auction event created by Mansi Jain for 10 laptop models.',
      status: 'ended',
      startTime,
      endTime,
    };

    await pool.query(
      `INSERT INTO entire_events (event_id, event_details, items, bids) VALUES ($1, $2, $3, $4)`,
      [eventId, JSON.stringify(snapshotDetails), JSON.stringify(fetchItems.rows), JSON.stringify(fetchBids.rows)]
    );
    console.log(`📸 Created AI Snapshot in entire_events table for event ID: ${eventId}`);
  }

  console.log('✨ Concurrent Testing Execution Completed Successfully!');
};

if (require.main === module) {
  runE2ETestFlow()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('❌ Concurrent Testing Failed:', err);
      process.exit(1);
    });
}
