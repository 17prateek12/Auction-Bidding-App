import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import { AuthenticationRequest } from '../interface/interface';
import { ApiError } from '../utils/ApiError';
import {
  placeBidService,
  getLeaderboardService,
  getUserRankService,
} from '../services/bidService';

// ------------------------------------------------------------- Place Bid via REST HTTP
const placeBid = asyncHandler(
  async (req: AuthenticationRequest, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) {
      throw new ApiError(401, 'Unauthorized - Please login');
    }

    const { eventId, itemId, amount } = req.body;

    const result = await placeBidService({
      userId,
      eventId,
      itemId,
      amount,
    });

    res.status(200).json({
      message: 'Bid placed successfully',
      ...result,
    });
  }
);

// ------------------------------------------------------------- Get Item Leaderboard
const getLeaderboard = asyncHandler(async (req: Request, res: Response) => {
  const { eventId, itemId } = req.query;

  const result = await getLeaderboardService(
    eventId as string,
    itemId as string
  );

  res.status(200).json({
    message: 'Leaderboard fetched successfully',
    ...result,
  });
});

// ------------------------------------------------------------- Get User Rank Across Items
const getUserRank = asyncHandler(
  async (req: AuthenticationRequest, res: Response) => {
    const { eventId } = req.query;
    const userId = req.user?.userId || (req.query.userId as string);

    const result = await getUserRankService(userId, eventId as string);

    res.status(200).json({
      message: 'User ranks fetched successfully',
      ...result,
    });
  }
);

export { placeBid, getLeaderboard, getUserRank };
