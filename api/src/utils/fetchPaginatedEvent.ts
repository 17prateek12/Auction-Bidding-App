import { pool } from '../connection/postgresConfig';

export const getPaginatedEventByStatus = async (page: number = 1, limit: number = 10) => {
  // Auto-transition active events whose end_time has passed to 'ended'
  await pool.query(
    `UPDATE events SET event_status = 'ended' WHERE event_status = 'active' AND end_time <= NOW()`
  );

  const offset = (page - 1) * limit;
  const statuses: ('upcoming' | 'active' | 'ended')[] = ['upcoming', 'active', 'ended'];
  const paginationEventbyStatus: Record<string, any> = {};

  for (const status of statuses) {
    const [eventsRes, countRes] = await Promise.all([
      pool.query(
        `SELECT * FROM events WHERE event_status = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
        [status, limit, offset]
      ),
      pool.query(
        `SELECT COUNT(*) FROM events WHERE event_status = $1`,
        [status]
      ),
    ]);

    const totalCount = parseInt(countRes.rows[0].count, 10) || 0;
    const totalPages = Math.ceil(totalCount / limit) || 1;

    paginationEventbyStatus[status] = {
      event: eventsRes.rows,
      currentPage: page,
      totalPages,
      totalCount,
    };
  }
  return paginationEventbyStatus;
};