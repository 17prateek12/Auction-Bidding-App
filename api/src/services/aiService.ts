import { pool } from '../connection/postgresConfig';
import { generateGeminiContent } from '../utils/geminiConfig';
import { ApiError } from '../utils/ApiError';

// ------------------------------------------------------------- Process Ended Events & Create Snapshots
export const processEndedEventsService = async () => {
  const currentTime = new Date();
  let processedCount = 0;

  try {
    const endedEventsRes = await pool.query(
      `SELECT * FROM events WHERE end_time <= $1 AND event_status != 'ended'`,
      [currentTime]
    );

    for (const eventRow of endedEventsRes.rows) {
      const eventId = eventRow.id;

      // Update status to 'ended'
      await pool.query(`UPDATE events SET event_status = 'ended' WHERE id = $1`, [
        eventId,
      ]);

      // Fetch Items and Bids
      const itemsRes = await pool.query(
        `SELECT * FROM items WHERE event_id = $1`,
        [eventId]
      );
      const bidsRes = await pool.query(
        `SELECT * FROM bids WHERE event_id = $1 ORDER BY amount ASC`,
        [eventId]
      );

      // Save snapshot to entire_events
      await pool.query(
        `
        INSERT INTO entire_events (event_id, event_details, items, bids)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (event_id) DO NOTHING;
      `,
        [
          eventId,
          JSON.stringify(eventRow),
          JSON.stringify(itemsRes.rows),
          JSON.stringify(bidsRes.rows),
        ]
      );

      processedCount++;
    }
  } catch (pgErr) {
    console.error('Error processing ended events in PostgreSQL:', pgErr);
  }

  return {
    message: 'Ended events processed successfully',
    processedCount,
  };
};

// ------------------------------------------------------------- AI Chat Scoped to Event & Role-Based Visibility
export const askEventAiService = async ({
  eventId,
  question,
  requestingUserId,
}: {
  eventId: string;
  question: string;
  requestingUserId: string;
}) => {
  if (!eventId || !question || !requestingUserId) {
    throw new ApiError(400, 'eventId, question, and user authentication are required');
  }

  // Fetch snapshot from PostgreSQL
  let snapshot: any = null;
  try {
    const snapshotRes = await pool.query(
      `SELECT * FROM entire_events WHERE event_id = $1`,
      [eventId]
    );

    if (snapshotRes.rows.length > 0) {
      snapshot = snapshotRes.rows[0];
    }
  } catch (err) {
    console.error('Error fetching snapshot from PostgreSQL:', err);
  }

  // If no snapshot exists, try running processEndedEventsService
  if (!snapshot) {
    await processEndedEventsService();
    const retryRes = await pool.query(
      `SELECT * FROM entire_events WHERE event_id = $1`,
      [eventId]
    );

    if (retryRes.rows.length > 0) {
      snapshot = retryRes.rows[0];
    }
  }

  if (!snapshot) {
    throw new ApiError(
      404,
      'Event snapshot not found. Make sure the event has ended and is snapshotted.'
    );
  }

  const eventDetails = typeof snapshot.event_details === 'string' ? JSON.parse(snapshot.event_details) : snapshot.event_details;
  const items = typeof snapshot.items === 'string' ? JSON.parse(snapshot.items) : snapshot.items;
  const rawBids = typeof snapshot.bids === 'string' ? JSON.parse(snapshot.bids) : snapshot.bids;

  // Determine Role (Creator vs Participant)
  const creatorId = eventDetails.creator_id;
  const isCreator = creatorId === requestingUserId;

  let filteredBids: any[] = [];

  if (isCreator) {
    // Creator sees all participant bids & ranks
    filteredBids = rawBids;
  } else {
    // Participant sees ONLY their own bids & ranks
    filteredBids = rawBids.filter(
      (b: any) => b.user_id === requestingUserId
    );
  }

  // Enrich user IDs with Human-Readable Names & Emails (Hiding database UUIDs)
  const userIds = Array.from(new Set(filteredBids.map((b: any) => b.user_id).filter(Boolean)));
  let userMap: Map<string, { name: string; email: string }> = new Map();

  if (userIds.length > 0) {
    try {
      const usersRes = await pool.query(
        `SELECT id, name, email FROM users WHERE id = ANY($1::uuid[])`,
        [userIds]
      );
      usersRes.rows.forEach((u) => {
        userMap.set(u.id, { name: u.name || u.email, email: u.email });
      });
    } catch (uErr) {
      console.error('Error resolving user names for AI prompt:', uErr);
    }
  }

  const enrichedBids = filteredBids.map((b: any) => {
    const userInfo = userMap.get(b.user_id) || { name: 'Participant', email: '' };
    return {
      bidder_name: userInfo.name,
      bidder_email: userInfo.email,
      amount: parseFloat(b.amount),
      rank: b.rank,
      itemId: b.item_id,
    };
  });

  const promptContext = {
    role: isCreator ? 'Event Creator (Full Visibility Access)' : 'Event Participant (Self-Bid Access Only)',
    eventDetails: {
      name: eventDetails.name,
      status: eventDetails.event_status,
      startTime: eventDetails.start_time,
      endTime: eventDetails.end_time,
    },
    items,
    bids: enrichedBids,
  };

  const prompt = `
You are an AI Analytics Assistant specialized in evaluating reverse auction bidding events.
Answer the user's question based STRICTLY on the provided context below.

CRITICAL PRIVACY & FORMATTING RULES:
1. NEVER output raw database GUIDs, UUIDs, or user_id strings (such as "10404ac3-5c9a-460d-b485-618df79bcfb1"). Internal database UUIDs are sensitive system data!
2. ALWAYS output human-readable names (e.g. "Mansi Jain", "Alice Bidder", "Yashu Supplier", "You") when referring to bidders or winners.
3. Keep response concise, structured, and easy to read.

Role Context:
${promptContext.role}

Event Data Context:
${JSON.stringify(promptContext, null, 2)}

User Question:
${question}
  `;

  const aiResponse = await generateGeminiContent(prompt);

  return {
    message: 'Response generated successfully',
    isCreator,
    response: aiResponse,
  };
};
