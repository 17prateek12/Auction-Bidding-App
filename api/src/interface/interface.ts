import { Request } from "express";

export interface IUser {
  id: string;
  name: string;
  email: string;
  password_hash: string;
  registration_time: string;
  created_at: Date;
}

export interface Aucevent {
  id: string;
  name: string;
  description?: string;
  start_time: Date;
  end_time: Date;
  event_date: Date;
  creator_id: string;
  event_status: 'upcoming' | 'active' | 'ended';
  columns: string[];
  created_at: Date;
}

export interface IItems {
  id: string;
  event_id: string;
  column_data: Record<string, any>;
  created_by?: string;
  created_at: Date;
}

export interface DecodeToken {
  userId: string;
  email: string;
  name: string;
}

export interface AuthenticationRequest extends Request {
  user?: DecodeToken;
}

export interface IBid {
  id: string;
  event_id: string;
  user_id: string;
  item_id: string;
  amount: number;
  rank: number;
  created_at: Date;
}

export interface IEntireEvent {
  id: string;
  event_id: string;
  event_details: any;
  items: any[];
  bids: any[];
  created_at: Date;
}
