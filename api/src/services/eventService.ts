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
  description?: string;
  startTime: Date;
  endTime: Date;
  eventDate: Date;
  columns: string[];
  rows: Array<Record<string, any>>;
}) => {
  if (!creatorId || !name || !startTime || !endTime || !columns || !rows) {
    throw new ApiError(400, 'All required event fields must be provided');
  }

  const now = new Date();
  if (startTime < now && Math.abs(startTime.getTime() - now.getTime()) > 60000) {
    throw new ApiError(400, 'Start time cannot be in the past');
  }

  if (endTime <= startTime) {
    throw new ApiError(400, 'End time must be after start time');
  }

  let status = 'upcoming';
  if (now >= startTime && now < endTime) {
    status = 'active';
  } else if (now >= endTime) {
    status = 'ended';
  }

  const client = await pool.connect();

  try {
    // Start Transaction
    await client.query('BEGIN');

    // Insert Event Record
    const eventInsertRes = await client.query(
      `
      INSERT INTO events (creator_id, name, description, start_time, end_time, event_date, event_status, columns)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *;
    `,
      [
        creatorId,
        name,
        description || '',
        startTime,
        endTime,
        eventDate || startTime,
        status,
        JSON.stringify(columns),
      ]
    );

    const savedEvent = eventInsertRes.rows[0];
    const eventId = savedEvent.id;

    // Bulk Batch Insert Items in chunks of 500
    const CHUNK_SIZE = 500;
    const savedItems: any[] = [];

    for (let i = 0; i < rows.length; i += CHUNK_SIZE) {
      const chunk = rows.slice(i, i + CHUNK_SIZE);
      const valueTuples: string[] = [];
      const queryParams: any[] = [];
      let paramIndex = 1;

      for (const row of chunk) {
        valueTuples.push(`($${paramIndex}, $${paramIndex + 1}, $${paramIndex + 2})`);
        queryParams.push(eventId, JSON.stringify(row), creatorId);
        paramIndex += 3;
      }

      const bulkQuery = `
        INSERT INTO items (event_id, column_data, created_by)
        VALUES ${valueTuples.join(', ')}
        RETURNING *;
      `;

      const bulkRes = await client.query(bulkQuery, queryParams);
      savedItems.push(...bulkRes.rows);
    }

    // Commit SQL changes
    await client.query('COMMIT');

    return {
      event: savedEvent,
      items: savedItems,
    };
  } catch (error) {
    // Rollback transaction on any failure (preventing partial uploads)
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
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
    items: fetchItemsRes.rows,
    item: fetchItemsRes.rows,
  };
};
