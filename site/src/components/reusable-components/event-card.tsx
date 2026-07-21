'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { Calendar, Clock, User, ArrowRight, Activity, CheckCircle2, Eye } from 'lucide-react';
import Cookies from 'js-cookie';
import { Button } from '@/components/ui/button';

export interface EventCardProps {
  event: any;
}

const EventCard: React.FC<EventCardProps> = ({ event }) => {
  const [mounted, setMounted] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | undefined>(undefined);

  useEffect(() => {
    setMounted(true);
    setCurrentUserId(Cookies.get('userId'));
  }, []);

  const eventId = event.id || event._id;
  const name = event.name || event.eventName || 'Bidding Event';
  const description = event.description || 'No description provided';
  const creatorId = event.creator_id || event.createdBy;
  const isCreatedByMe = mounted && currentUserId && creatorId === currentUserId;

  const eventDateRaw = event.event_date || event.eventDate || event.start_time || event.startTime;
  const startTimeRaw = event.start_time || event.startTime;
  const endTimeRaw = event.end_time || event.endTime;

  // Compute effective status dynamically based on current time vs end_time
  const rawStatus = event.event_status || event.eventStatus || 'upcoming';
  const isTimeEnded = Boolean(endTimeRaw && new Date() >= new Date(endTimeRaw));
  const status: 'upcoming' | 'active' | 'ended' = isTimeEnded ? 'ended' : rawStatus;

  const formattedDate = eventDateRaw ? format(new Date(eventDateRaw), 'MMM dd, yyyy') : 'N/A';
  const formattedStart = startTimeRaw ? format(new Date(startTimeRaw), 'hh:mm a') : 'N/A';
  const formattedEnd = endTimeRaw ? format(new Date(endTimeRaw), 'hh:mm a') : 'N/A';

  return (
    <div className="w-full max-w-sm rounded-xl border border-gray-700 bg-gray-900 p-5 text-white shadow-lg transition-all duration-300 hover:border-blue-500 hover:shadow-blue-500/10 flex flex-col justify-between">
      <div>
        {/* Top Header & Badges */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${
              status === 'active'
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : status === 'upcoming'
                ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                : 'bg-red-500/20 text-red-400 border border-red-500/30'
            }`}
          >
            {status === 'active' && <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />}
            {status === 'active' ? 'Live Bidding' : status === 'upcoming' ? 'Upcoming' : 'Ended'}
          </span>

          {isCreatedByMe && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-500/20 text-purple-300 border border-purple-500/30">
              <User className="w-3 h-3" /> Created by You
            </span>
          )}
        </div>

        {/* Title & Description */}
        <h3 className="text-xl font-bold text-gray-100 line-clamp-1 mb-2">{name}</h3>
        <p className="text-sm text-gray-400 line-clamp-2 mb-4 h-10">{description}</p>

        {/* Date & Time Metadata */}
        <div className="space-y-2 text-xs text-gray-300 bg-gray-800/60 p-3 rounded-lg border border-gray-700/50 mb-5">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-blue-400" />
            <span>Date: <strong>{formattedDate}</strong></span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-emerald-400" />
            <span>Time: <strong>{formattedStart} - {formattedEnd}</strong></span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div>
        {status === 'active' && (
          isCreatedByMe ? (
            <Button asChild className="w-full bg-purple-600 hover:bg-purple-500 text-white font-semibold flex items-center justify-center gap-2 shadow-md shadow-purple-900/30">
              <Link href={`/live-event/${eventId}`}>
                <Eye className="w-4 h-4" /> View Live Event <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
          ) : (
            <Button asChild className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold flex items-center justify-center gap-2 shadow-md shadow-emerald-900/30">
              <Link href={`/live-event/${eventId}`}>
                <Activity className="w-4 h-4" /> Participate / Bid Now <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
          )
        )}

        {status === 'upcoming' && (
          <Button disabled variant="outline" className="w-full border-blue-500/30 bg-blue-500/10 text-blue-300 cursor-not-allowed">
            <Clock className="w-4 h-4 mr-1" /> Starts at {formattedStart}
          </Button>
        )}

        {status === 'ended' && (
          <Button asChild variant="secondary" className="w-full border border-gray-600 bg-gray-800 hover:bg-gray-700 text-gray-200">
            <Link href={`/past-event/${eventId}`}>
              <CheckCircle2 className="w-4 h-4 text-emerald-400 mr-1" /> View Results & AI Chat
            </Link>
          </Button>
        )}
      </div>
    </div>
  );
};

export default EventCard;