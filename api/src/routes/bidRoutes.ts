import express from 'express';
import { placeBid, getLeaderboard, getUserRank } from '../controllers/bidController';
import validateToken from '../middleware/validateTokenHandler';

const router = express.Router();

router.route('/place').post(validateToken, placeBid);
router.route('/leaderboard').get(getLeaderboard);
router.route('/user-rank').get(validateToken, getUserRank);

export default router;
