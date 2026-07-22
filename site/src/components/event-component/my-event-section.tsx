'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useMyEvents } from '@/hooks/useEventQueries';
import LiveEventSection from './live-event-section';
import UpcomingEventSection from './upcoming-event-section';
import PastEventSection from './past-event-section';
import { Loader2, PlusCircle } from 'lucide-react';
import Link from 'next/link';

const MyEventSection = () => {
  const [mounted, setMounted] = useState(false);
  const { data: myEvents, isLoading, isError } = useMyEvents();

  useEffect(() => {
    setMounted(true);
  }, []);

  const eventsList = useMemo(() => (Array.isArray(myEvents) ? myEvents : []), [myEvents]);

  // Compute status dynamically on the client to avoid backend clock sync latency/drift
  const { activeEvents, upcomingEvents, endedEvents } = useMemo(() => {
    const active: any[] = [];
    const upcoming: any[] = [];
    const ended: any[] = [];

    const now = new Date();

    eventsList.forEach((e) => {
      const startTimeRaw = e.start_time || e.startTime;
      const endTimeRaw = e.end_time || e.endTime;
      const rawStatus = e.event_status || e.eventStatus || 'upcoming';

      const startTime = startTimeRaw ? new Date(startTimeRaw) : null;
      const endTime = endTimeRaw ? new Date(endTimeRaw) : null;

      let status = rawStatus;

      if (endTime && now >= endTime) {
        status = 'ended';
      } else if (startTime && endTime && now >= startTime && now < endTime) {
        status = 'active';
      }

      const enrichedEvent = { ...e, event_status: status };

      if (status === 'active') {
        active.push(enrichedEvent);
      } else if (status === 'ended') {
        ended.push(enrichedEvent);
      } else {
        upcoming.push(enrichedEvent);
      }
    });

    return { activeEvents: active, upcomingEvents: upcoming, endedEvents: ended };
  }, [eventsList]);

  if (!mounted || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="text-center py-10 text-red-400">
        Failed to load your events. Please make sure you are logged in.
      </div>
    );
  }

  if (eventsList.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-10 rounded-xl border border-dashed border-gray-700 bg-gray-900/50 text-center my-6">
        <h3 className="text-xl font-bold text-gray-200 mb-2">No Events Created Yet</h3>
        <p className="text-sm text-gray-400 mb-6 max-w-md">
          You have not created any bidding events. Create your first event with custom items or Excel upload!
        </p>
        <Link
          href="/create-event"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium transition-colors"
        >
          <PlusCircle className="w-5 h-5" /> Create New Event
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col gap-8 my-6">
      {/* 1. Live Bidding Events */}
      <LiveEventSection events={activeEvents} />

      {/* 2. Upcoming Events */}
      <UpcomingEventSection events={upcomingEvents} />

      {/* 3. Past & Completed Events */}
      <PastEventSection events={endedEvents} />
    </div>
  );
};

export default MyEventSection;