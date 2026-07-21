import React from 'react';
import EventCard from '../reusable-components/event-card';

const UpcomingEventSection: React.FC<{ events?: any[] }> = ({ events = [] }) => {
  if (events.length === 0) return null;

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-blue-400">Upcoming Events</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {events.map((event) => (
          <EventCard key={event.id || event._id} event={event} />
        ))}
      </div>
    </div>
  );
};

export default UpcomingEventSection;