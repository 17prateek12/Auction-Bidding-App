import Event from '../model/eventModel';
import Item from '../model/itemModel';
import User from '../model/userModel';
import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import { AuthenticationRequest } from '../interface/interface';
import { ApiError } from '../utils/ApiError';
import { updateEventStatus } from '../utils/updateEventStatus';
import { getPaginatedEventByStatus } from '../utils/fetchPaginatedEvent';

//-----------------------------------------------------------create event
const EventDetails = asyncHandler(async (req: AuthenticationRequest, res: Response) => {

    console.log(req);

    if (!req?.user) {
        throw new ApiError(403, 'Unauthorized - Please login')
    }
    const { eventName, eventDate, startTime, endTime, description, rows, columns } = req.body;

    if (!eventName || !eventDate || !startTime || !endTime || !Array.isArray(columns) || !Array.isArray(rows)) {
        throw new ApiError(400, 'All fields are required');
    };

    const createdBy = req.user.userId;

    const existingEvent = await Event.findOne({ eventName, eventDate, createdBy });
    if (existingEvent) {
        throw new ApiError(400, 'An event with the same name and date already exists.');
    }

    const newEvent = new Event({
        eventName,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        description: description || '',
        createdBy,
        eventDate: new Date(eventDate),
        columns,
    });

    const savedEvent = await newEvent.save();

    const itemSaved = rows.map(row => ({
        eventId: savedEvent._id,
        columnData: Object.fromEntries(
            Object.entries(row).map(([key, value]) => [key, String(value)])
        ),
        createdBy,
    }));

    const savedItem = await Item.insertMany(itemSaved);

    res.status(201).json({
        message: 'Event and item are created successfully',
        event: savedEvent,
        items: savedItem,
    });
});


//-----------------------------------------------------------fetch all event in database
const FetchAllEvent = asyncHandler(async (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = 10;
    
    const data = await getPaginatedEventByStatus(page,limit);

    res.status(200).json({
        message: 'All event fetch successfully',
        event: data,
    })
})

//-----------------------------------------------------------get all event created by user
const GetAllEventByUser = asyncHandler(async (req: AuthenticationRequest, res: Response) => {
    try {
        const userId = req.user?.userId;

        const usertEvent = await Event.find({ createdBy: userId });
        res.status(200).json({
            message: `All Event created by ${req.user?.name} fetch successFully`,
            event: usertEvent
        });
    } catch (error: any) {
        console.error("Error creating event:", error.message);
        res.status(500).json({ message: "Error creating event", error: error.message });
    }
})

//-----------------------------------------------------------get particular event with item
const EventItemsById = asyncHandler(async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const fetchEvent = await Event.findById(id)
        if (!fetchEvent) {
            res.status(404);
            throw new Error("Event not found");
        }
        const fetchItem = await Item.find({ eventId: id });

        res.status(200).json({
            message: `Event ${fetchEvent?.eventName} fetch successfully`,
            event: fetchEvent,
            item: fetchItem
        });
    } catch (error: any) {
        console.error("Error creating event:", error.message);
        res.status(500).json({ message: "Error creating event", error: error.message });
    }
})

export { EventDetails, GetAllEventByUser, EventItemsById, FetchAllEvent }