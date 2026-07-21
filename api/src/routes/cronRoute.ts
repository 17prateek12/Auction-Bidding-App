import express from 'express';
import { updateAllEventStatuses } from '../utils/getAllEventStatus';
import { validateCronSecret } from '../middleware/cronAuthMiddleware';

const router = express.Router();

router.route('/update-event').post(validateCronSecret, updateAllEventStatuses);

export default router;