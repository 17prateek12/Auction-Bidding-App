import express from 'express';
import {
  EventDetails,
  GetAllEventByUser,
  EventItemsById,
  FetchAllEvent,
  processEndedEvents,
  getEntireEventByEventId,
} from '../controllers/eventController';
import validateToken from '../middleware/validateTokenHandler';
import { validateCronSecret } from '../middleware/cronAuthMiddleware';

const router = express.Router();

router.route('/create-event').post(validateToken, EventDetails);
router.route('/events').get(FetchAllEvent);
router.route('/user-event').get(validateToken, GetAllEventByUser);
router.route('/user-event/:id').get(validateToken, EventItemsById);
router.route('/get-event/:id').get(validateToken, EventItemsById);
router.route('/eventEnd').get(validateCronSecret, processEndedEvents).post(validateCronSecret, processEndedEvents);
router.route('/getEntireEvent/:eventid').post(validateToken, getEntireEventByEventId);

export default router;