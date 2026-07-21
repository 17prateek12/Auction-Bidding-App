import { updateEventStatus } from "./updateEventStatus";
import asyncHandler from 'express-async-handler';
import { Request, Response } from "express";
import { ApiError } from "./ApiError";
import { pool } from "../connection/postgresConfig";

export const updateAllEventStatuses = asyncHandler(async (req: Request, res: Response) => {
  const secret = req.headers['x-cron-secret'];
  if (secret !== process.env.CRON_SECRET) {
    throw new ApiError(403, 'Forbidden - Invalid Secret');
  }

  const eventsRes = await pool.query(`SELECT * FROM events`);
  const allevents = eventsRes.rows;
  let updateCount = 0;

  for (const event of allevents) {
    const newStatus = await updateEventStatus(event);
    if (event.event_status !== newStatus) {
      await pool.query(`UPDATE events SET event_status = $1 WHERE id = $2`, [
        newStatus,
        event.id,
      ]);
      updateCount++;
    }
  }

  res.status(200).json({
    message: 'Event Status updated',
    totalEvents: allevents.length,
    updateCount,
  });
});