import asyncHandler from "express-async-handler";
import jwt from 'jsonwebtoken';
import { Response, NextFunction } from "express";
import { DecodeToken, AuthenticationRequest } from "../interface/interface";
import { ApiError } from "../utils/ApiError";

const validToken = asyncHandler(async (req: AuthenticationRequest, res: Response, next: NextFunction) => {
    let token;
    const authHeader = req.headers.authorization || req.headers.Authorization;

    if (!authHeader || typeof authHeader !== 'string' || !authHeader.startsWith('Bearer ')) {
        throw new ApiError(403, 'Unauthorized - Please login');
    }
    try {
        token = authHeader.split(" ")[1];
        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET as string) as DecodeToken;
        req.user = { userId: decoded.userId, email: decoded.email, name: decoded.name };
        next();
    } catch (error) {
        throw new ApiError(401, "Unauthorized - Invalid token");
    }
});

export default validToken;
