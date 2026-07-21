import { pool } from '../connection/postgresConfig';
import { ApiError } from '../utils/ApiError';
import { getPaginatedEventByStatus } from '../utils/fetchPaginatedEvent';

export const createEventService = async ({
  creatorId,
  name,
  description,
  startTime,
  endTime,
  eventDate,
  columns,
  rows,
}: {
  creatorId: string;
  name: string;
  description: string;
  startTime: Date;
  endTime: Date;
  eventDate: Date;
  columns: string[];
  rows: Record<string, any>[];
}) => {
  if (
    !creatorId ||
    !name ||
    !startTime ||
    !endTime ||
    !columns ||
    !rows ||
    rows.length === 0
  ) {
    throw new ApiError(
      400,
      'Missing required fields (creatorId, name, startTime, endTime, columns, rows)'
    );
  }

  const now = new Date();
  if (startTime < now && Math.abs(startTime.getTime() - now.getTime()) > 5 * 60 * 1000) {
    throw new ApiError(400, 'Start time cannot be in the past');
  }

  if (endTime <= startTime) {
    throw new ApiError(400, 'End time must be after start time');
  }

  let eventStatus: 'upcoming' | 'active' | 'ended' = 'active';
  if (now < startTime && (startTime.getTime() - now.getTime()) > 5 * 60 * 1000) {
    eventStatus = 'upcoming';
  } else if (now >= endTime) {
    eventStatus = 'ended';
  }

  const eventQuery = `
    INSERT INTO events (creator_id, name, description, start_time, end_time, event_date, event_status, columns)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING *;
  `;
  const eventValues = [
    creatorId,
    name,
    description || '',
    startTime,
    endTime,
    eventDate || startTime,
    eventStatus,
    JSON.stringify(columns),
  ];

  const eventRes = await pool.query(eventQuery, eventValues);
  const savedEvent = eventRes.rows[0];

  const savedItems: any[] = [];
  const chunkSize = 500;

  for (let i = 0; i < rows.length; i += chunkSize) {
    const chunk = rows.slice(i, i + chunkSize);
    const valueTuples: string[] = [];
    const queryParams: any[] = [];
    let paramIndex = 1;

    for (const row of chunk) {
      const columnData = Object.fromEntries(
        Object.entries(row).map(([key, value]) => [key, String(value)])
      );
      valueTuples.push(`($${paramIndex}, $${paramIndex + 1}, $${paramIndex + 2})`);
      queryParams.push(savedEvent.id, JSON.stringify(columnData), creatorId);
      paramIndex += 3;
    }

    const bulkQuery = `
      INSERT INTO items (event_id, column_data, created_by)
      VALUES ${valueTuples.join(', ')}
      RETURNING *;
    `;

    const bulkRes = await pool.query(bulkQuery, queryParams);
    savedItems.push(...bulkRes.rows);
  }

  return {
    event: savedEvent,
    items: savedItems,
  };
};

export const fetchAllEventsService = async (page: number = 1, limit: number = 10) => {
  if (page < 1 || limit < 1) {
    throw new ApiError(400, 'Page and limit must be positive numbers');
  }
  return await getPaginatedEventByStatus(page, limit);
};

export const getEventsByUserService = async (userId: string) => {
  if (!userId) {
    throw new ApiError(400, 'User ID is required');
  }

  // Auto-transition ended events for this user
  await pool.query(
    `UPDATE events SET event_status = 'ended' WHERE event_status = 'active' AND end_time <= NOW()`
  );

  const userEventsRes = await pool.query(
    `SELECT * FROM events WHERE creator_id = $1 ORDER BY created_at DESC`,
    [userId]
  );
  return userEventsRes.rows;
};

export const getEventItemsByIdService = async (eventId: string) => {
  if (!eventId) {
    throw new ApiError(400, 'Event ID is required');
  }

  const fetchEventRes = await pool.query(
    `SELECT * FROM events WHERE id = $1`,
    [eventId]
  );

  if (fetchEventRes.rows.length === 0) {
    throw new ApiError(404, 'Event not found');
  }

  const fetchItemsRes = await pool.query(
    `SELECT * FROM items WHERE event_id = $1`,
    [eventId]
  );

  return {
    event: fetchEventRes.rows[0],
    item: fetchItemsRes.rows,
  };
};
