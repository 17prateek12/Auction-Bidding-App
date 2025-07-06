import mongoose, { Document } from "mongoose";
import { Request } from "express";

export interface IUser extends Document{
    name:string;
    email:string;
    password:string;
    registrationTime:string;
};

export interface Aucevent extends Document{
    eventName: string;
    startTime: Date;
    endTime: Date;
    eventDate : Date;
    description?: string;
    items: mongoose.Types.ObjectId[];
    createdBy: mongoose.Types.ObjectId;
    eventStatus: 'upcoming' | 'active' | 'ended';
    columns: string[];
};

export interface IItems extends Document{
    eventId: mongoose.Types.ObjectId;
    columnData: Map<string, any>;
    createdBy: mongoose.Types.ObjectId;
};

export interface DecodeToken{
    userId: string;
    email: string;
    name: string;
};

export interface AuthenticationRequest extends Request{
    user?: DecodeToken
};

  
export interface IBid extends Document {
    event: mongoose.Types.ObjectId;
    user: mongoose.Types.ObjectId;
    item:mongoose.Types.ObjectId;
    amount:number;
    rank:number;
}
