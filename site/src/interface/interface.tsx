import { LucideIcon } from "lucide-react";
import { EventForm, TimeObject } from "../types/create-event-type";
import { MouseEventHandler } from "react";

export interface QueryProviderProps {
    children: React.ReactNode;
}

export interface NavBarItem {
    logo: LucideIcon;
    label: string;
    link: string;
}

// Domain Model Types for Real-Time Bidding & Sourcing Events
export interface SourcingEvent {
  id?: string;
  _id?: string;
  name?: string;
  eventName?: string;
  description: string;
  creator_id: string;
  createdBy?: string;
  event_date: string;
  eventDate?: string;
  start_time: string;
  startTime?: string;
  end_time: string;
  endTime?: string;
  event_status: 'upcoming' | 'active' | 'ended';
  eventStatus?: 'upcoming' | 'active' | 'ended';
  columns: string[] | string;
}

export interface SourcingItem {
  id: string;
  _id?: string;
  event_id: string;
  column_data: string | Record<string, string | number>;
  created_by?: string;
  created_at?: string;
}

export interface BidderEntry {
  userId: string;
  amount: number | null;
  rank: number;
  userName: string;
  userEmail: string;
}

export interface UserBidState {
  amount: number;
  rank: number;
}

export interface DateTimePickerProps {
    startDate: Date | undefined;
    endDate: Date | undefined;
    eventstartTime: TimeObject;
    eventendTime: TimeObject;
    onChange: (field: keyof EventForm | 'eventstartTime' | 'eventendTime', value: string | TimeObject | Date | undefined) => void;
}

export interface Heading {
    text: string;
    isImp: boolean;
}

export interface UiButton{
    text:string;
    onClick: MouseEventHandler;
}