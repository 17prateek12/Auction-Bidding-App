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

  // Extract events array from response
  const eventsList = useMemo(() => {
    if (!rawData) return [];
    if (Array.isArray(rawData)) return rawData;
    if (rawData.upcoming || rawData.active || rawData.ended) {
      const all: any[] = [];
      if (rawData.active?.event) all.push(...rawData.active.event);
      if (rawData.upcoming?.event) all.push(...rawData.upcoming.event);
      if (rawData.ended?.event) all.push(...rawData.ended.event);
      return all;
    }
    return [];
  }, [rawData]);

  // Compute counts for status badges
  const counts = useMemo(() => {
    const activeCount = eventsList.filter(
      (e) => (e.event_status || e.eventStatus) === 'active'
    ).length;
    const upcomingCount = eventsList.filter(
      (e) => (e.event_status || e.eventStatus) === 'upcoming'
    ).length;
    const endedCount = eventsList.filter(
      (e) => (e.event_status || e.eventStatus) === 'ended'
    ).length;
    return { activeCount, upcomingCount, endedCount };
  }, [eventsList]);

  // Filtered Events based on Checkboxes & Search Query
  const filteredEvents = useMemo(() => {
    return eventsList.filter((event) => {
      const status = (event.event_status || event.eventStatus || 'upcoming') as
        | 'active'
        | 'upcoming'
        | 'ended';

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
      <div className="flex items-center justify-center min-h-[300px]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="text-center py-10 text-red-400">
        Failed to load events. Please check your network connection.
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      {/* HackerRank-style Filter Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-4 rounded-xl border border-gray-700 bg-gray-900/80 backdrop-blur-md">
        {/* Status Checkboxes using Shadcn Button */}
        <div className="flex items-center gap-3 flex-wrap w-full md:w-auto">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5 mr-2">
            <Filter className="w-4 h-4 text-blue-400" /> Filter Status:
          </span>

          {/* Live Checkbox */}
          <Button
            type="button"
            size="sm"
            variant={selectedStatuses.active ? 'default' : 'outline'}
            onClick={() => toggleStatus('active')}
            className={`flex items-center gap-2 transition-all ${
              selectedStatuses.active
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 hover:bg-emerald-500/30'
                : 'bg-gray-800 text-gray-400 border-gray-700 opacity-60 hover:opacity-100'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            Live Bidding
            <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] bg-emerald-500/30 text-emerald-200">
              {counts.activeCount}
            </span>
          </Button>

          {/* Upcoming Checkbox */}
          <Button
            type="button"
            size="sm"
            variant={selectedStatuses.upcoming ? 'default' : 'outline'}
            onClick={() => toggleStatus('upcoming')}
            className={`flex items-center gap-2 transition-all ${
              selectedStatuses.upcoming
                ? 'bg-blue-500/20 text-blue-300 border-blue-500/50 hover:bg-blue-500/30'
                : 'bg-gray-800 text-gray-400 border-gray-700 opacity-60 hover:opacity-100'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            Upcoming
            <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] bg-blue-500/30 text-blue-200">
              {counts.upcomingCount}
            </span>
          </Button>

          {/* Past / Ended Checkbox */}
          <Button
            type="button"
            size="sm"
            variant={selectedStatuses.ended ? 'secondary' : 'outline'}
            onClick={() => toggleStatus('ended')}
            className={`flex items-center gap-2 transition-all ${
              selectedStatuses.ended
                ? 'bg-gray-700 text-gray-200 border-gray-500 hover:bg-gray-600'
                : 'bg-gray-800 text-gray-400 border-gray-700 opacity-60 hover:opacity-100'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            Ended / Past
            <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] bg-gray-600 text-gray-300">
              {counts.endedCount}
            </span>
          </Button>
        </div>

        {/* Search Bar */}
        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search events..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 text-xs bg-gray-800 text-gray-100 rounded-lg border border-gray-700 focus:outline-none focus:border-blue-500 transition-colors placeholder:text-gray-500"
          />
        </div>
      </div>

      {/* Grid of Event Cards */}
      {filteredEvents.length === 0 ? (
        <div className="text-center py-16 text-gray-400 bg-gray-900/30 rounded-xl border border-gray-800">
          <p className="text-base font-medium">No events found matching your active filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredEvents.map((event: any) => (
            <EventCard key={event.id || event._id} event={event} />
          ))}
        </div>
      )}
    </div>
  );
};

export default AllEventsDashboard;
