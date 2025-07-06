import { updateEventStatus } from "./updateEventStatus";
import asyncHandler from 'express-async-handler';
import { Request, Response } from "express";
import { ApiError } from "./ApiError";
import Event from '../model/eventModel';

export const updateAllEventStatuses = asyncHandler(async (req: Request, res: Response) => {
    const secret = req.headers['x-cron-secret'];
    if (secret !== process.env.CRON_SECRET) {
        throw new ApiError(403, 'Forbidden - Invalid Secret');
    }

    const allevents = await Event.find();
    let update = 0;

    await Promise.all(
        allevents.map(async(event)=>{
            const newStatus = await updateEventStatus(event);
            if(event.eventStatus===newStatus){
               return;
            }
            event.eventStatus = newStatus;
            await event.save();
            update++;
        })
    );

    res.status(200).json({
        message:'Event Status updated',
        totalEvents: allevents.length,
        updateCount: update,
    });
});