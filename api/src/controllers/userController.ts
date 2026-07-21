import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import { AuthenticationRequest } from '../interface/interface';
import { ApiError } from '../utils/ApiError';
import {
  registerUserService,
  loginUserService,
  getAllUsersService,
} from '../services/userService';

const registerUser = asyncHandler(async (req: Request, res: Response) => {
  const result = await registerUserService(req.body);
  res.status(201).json(result);
});

const loginuser = asyncHandler(async (req: Request, res: Response) => {
  const result = await loginUserService(req.body);
  res.status(200).json(result);
});

const logoutUser = asyncHandler(
  async (req: AuthenticationRequest, res: Response) => {
    if (!req.user) {
      throw new ApiError(401, 'No user session found');
    }
    res.status(200).json({
      message: 'User logged out successfully',
      accessToken: null,
    });
  }
);

const getAllUser = asyncHandler(async (req: Request, res: Response) => {
  const alluser = await getAllUsersService();
  res.status(200).json({
    message: 'Get All Users',
    user: alluser,
  });
});

export { registerUser, loginuser, logoutUser, getAllUser };