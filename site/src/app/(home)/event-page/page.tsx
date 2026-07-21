import React from 'react';
import AllEventsDashboard from '@/components/event-component/all-events-dashboard';

const EventPage = () => {
  return (
    <div className="px-8 pt-8 w-full min-h-screen text-white">
      <div className="flex items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-100">Bidding Events</h1>
          <p className="text-sm text-gray-400 mt-1">
            Browse upcoming, live, and completed reverse-auction events.
          </p>
        </div>
      </div>
      <AllEventsDashboard />
    </div>
  );
};

export default EventPage;