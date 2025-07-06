import express from 'express';
import { updateAllEventStatuses } from '../utils/getAllEventStatus';

const router = express.Router();

router.route('/update-event').post(updateAllEventStatuses);

export default router;