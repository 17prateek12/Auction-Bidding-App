'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useAllEvents } from '@/hooks/useEventQueries';
import EventCard from '../reusable-components/event-card';
import { Loader2, Search, Filter, Activity, Clock, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

const AllEventsDashboard = () => {
  const [mounted, setMounted] = useState(false);
  const { data: rawData, isLoading, isError } = useAllEvents();

  useEffect(() => {
    setMounted(true);
  }, []);

  const [selectedStatuses, setSelectedStatuses] = useState<{
    active: boolean;
    upcoming: boolean;
    ended: boolean;
  }>({
    active: true,
    upcoming: true,
    ended: true,
  });

  const [searchQuery, setSearchQuery] = useState('');

  // Extract events array and compute client-side status dynamically to avoid clock sync drift
  const eventsList = useMemo(() => {
    let list: any[] = [];
    if (rawData) {
      if (Array.isArray(rawData)) {
        list = rawData;
      } else if (rawData.upcoming || rawData.active || rawData.ended) {
        if (rawData.active?.event) list.push(...rawData.active.event);
        if (rawData.upcoming?.event) list.push(...rawData.upcoming.event);
        if (rawData.ended?.event) list.push(...rawData.ended.event);
      }
    }

    const now = new Date();
    return list.map((e) => {
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

      return {
        ...e,
        event_status: status,
      };
    });
  }, [rawData]);

  // Compute counts for status badges
  const counts = useMemo(() => {
    const activeCount = eventsList.filter(
      (e) => e.event_status === 'active'
    ).length;
    const upcomingCount = eventsList.filter(
      (e) => e.event_status === 'upcoming'
    ).length;
    const endedCount = eventsList.filter(
      (e) => e.event_status === 'ended'
    ).length;
    return { activeCount, upcomingCount, endedCount };
  }, [eventsList]);

  // Filtered Events based on Checkboxes & Search Query
  const filteredEvents = useMemo(() => {
    return eventsList.filter((event) => {
      const status = event.event_status as 'active' | 'upcoming' | 'ended';

      const matchesStatus =
        (status === 'active' && selectedStatuses.active) ||
        (status === 'upcoming' && selectedStatuses.upcoming) ||
        (status === 'ended' && selectedStatuses.ended);

      const name = (event.name || event.eventName || '').toLowerCase();
      const matchesSearch = name.includes(searchQuery.toLowerCase());

      return matchesStatus && matchesSearch;
    });
  }, [eventsList, selectedStatuses, searchQuery]);

  const toggleStatus = (status: 'active' | 'upcoming' | 'ended') => {
    setSelectedStatuses((prev) => ({
      ...prev,
      [status]: !prev[status],
    }));
  };

  if (!mounted || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="text-center py-20 text-red-400">
        Failed to load sourcing events dashboard.
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col gap-6 mt-4">
      {/* 1. Header Title */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-white">Sourcing Events Dashboard</h1>
        <p className="text-sm text-gray-400 mt-1">
          Explore, participate, or monitor live reverse auction bidding events.
        </p>
      </div>

      {/* 2. Search & Filter Bar */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-gray-900/60 p-4 rounded-xl border border-gray-800">
        {/* Search */}
        <div className="relative w-full md:max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Search events by name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-11 pl-11 pr-4 bg-gray-950 border border-gray-800 rounded-lg text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
          />
        </div>

        {/* Filter Toggle Badges */}
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-xs text-gray-500 mr-2 flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5" /> Filter Status:
          </span>

          <Button
            variant="ghost"
            onClick={() => toggleStatus('active')}
            className={`h-9 px-4 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              selectedStatuses.active
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                : 'bg-gray-950 text-gray-500 border border-gray-850 hover:bg-gray-900'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            Live ({counts.activeCount})
          </Button>

          <Button
            variant="ghost"
            onClick={() => toggleStatus('upcoming')}
            className={`h-9 px-4 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              selectedStatuses.upcoming
                ? 'bg-blue-500/20 text-blue-400 border border-blue-500/40'
                : 'bg-gray-950 text-gray-500 border border-gray-850 hover:bg-gray-900'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            Upcoming ({counts.upcomingCount})
          </Button>

          <Button
            variant="ghost"
            onClick={() => toggleStatus('ended')}
            className={`h-9 px-4 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              selectedStatuses.ended
                ? 'bg-red-500/20 text-red-400 border border-red-500/40'
                : 'bg-gray-950 text-gray-500 border border-gray-850 hover:bg-gray-900'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            Ended ({counts.endedCount})
          </Button>
        </div>
      </div>

      {/* 3. Grid List */}
      {filteredEvents.length === 0 ? (
        <div className="text-center py-20 text-gray-500 border border-dashed border-gray-800 rounded-2xl bg-gray-900/10">
          No events match the selected filters or search query.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEvents.map((event) => (
            <EventCard key={event.id || event._id} event={event} />
          ))}
        </div>
      )}
    </div>
  );
};

export default AllEventsDashboard;
