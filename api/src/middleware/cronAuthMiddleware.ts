import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/ApiError';

export const validateCronSecret = (req: Request, res: Response, next: NextFunction) => {
  const cronSecret = process.env.CRON_SECRET;
  const providedSecret =
    req.headers['x-cron-secret'] ||
    req.headers['authorization']?.replace('Bearer ', '') ||
    req.query.cronSecret;

  if (!cronSecret || providedSecret !== cronSecret) {
    throw new ApiError(401, 'Unauthorized - Invalid or missing Cron Secret');
  }

  next();
};
