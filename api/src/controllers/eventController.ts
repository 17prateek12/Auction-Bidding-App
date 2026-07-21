import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import { AuthenticationRequest } from '../interface/interface';
import { ApiError } from '../utils/ApiError';
import {
  createEventService,
  fetchAllEventsService,
  getEventsByUserService,
  getEventItemsByIdService,
} from '../services/eventService';
import {
  processEndedEventsService,
  askEventAiService,
} from '../services/aiService';

// ----------------------------------------------------------- Create Event
const EventDetails = asyncHandler(
  async (req: AuthenticationRequest, res: Response) => {
    if (!req?.user) {
      throw new ApiError(403, 'Unauthorized - Please login');
    }

    const { eventName, name, description, startTime, endTime, eventDate, columns, rows } = req.body;

    const result = await createEventService({
      creatorId: req.user.userId,
      name: eventName || name,
      description: description || '',
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      eventDate: eventDate ? new Date(eventDate) : new Date(startTime),
      columns,
      rows,
    });

    res.status(201).json({
      message: 'Event and items created successfully',
      event: result.event,
      items: result.items,
    });
  }
);

// ----------------------------------------------------------- Fetch All Events
const FetchAllEvent = asyncHandler(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;

  const data = await fetchAllEventsService(page, limit);

  res.status(200).json({
    message: 'All events fetched successfully',
    event: data,
    ...data,
  });
});

// ----------------------------------------------------------- Get All Events Created By User
const GetAllEventByUser = asyncHandler(
  async (req: AuthenticationRequest, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) {
      throw new ApiError(401, 'Unauthorized');
    }

    const userEvents = await getEventsByUserService(userId);

    res.status(200).json(userEvents);
  }
);

// ----------------------------------------------------------- Get Event & Items By Event ID
const EventItemsById = asyncHandler(
  async (req: AuthenticationRequest, res: Response) => {
    const { id } = req.params;

    const result = await getEventItemsByIdService(id);

    res.status(200).json(result);
  }
);

// ----------------------------------------------------------- Process Ended Events
const processEndedEvents = asyncHandler(async (req: Request, res: Response) => {
  const result = await processEndedEventsService();
  res.status(200).json(result);
});

// ----------------------------------------------------------- Gemini AI Querying on Event Snapshot
const getEntireEventByEventId = asyncHandler(
  async (req: AuthenticationRequest, res: Response) => {
    const { eventid } = req.params;
    const { question } = req.body;
    const requestingUserId = req.user?.userId;

    if (!requestingUserId) {
      throw new ApiError(401, 'Unauthorized - Please login');
    }

    const result = await askEventAiService({
      eventId: eventid,
      question,
      requestingUserId,
    });

    res.status(200).json(result);
  }
);

export {
  EventDetails,
  GetAllEventByUser,
  EventItemsById,
  FetchAllEvent,
  processEndedEvents,
  getEntireEventByEventId,
};