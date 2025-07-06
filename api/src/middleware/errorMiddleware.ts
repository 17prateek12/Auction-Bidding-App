import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/ApiError';

const notFound = (req:Request , res:Response, next:NextFunction) =>{
    const error = new ApiError(404,`Not Found - ${req.originalUrl}`);
    next(error);
};

const errorHandler = (err: any, req:Request, res:Response, next:NextFunction) =>{
    const statusCode = err.statusCode || res.statusCode || 500;

    res.status(statusCode).json({
        message: err.message || 'Something went wrong',
        stack: process.env.NODE_ENV==='production'? null: err.stack
    });
};

export {notFound, errorHandler}