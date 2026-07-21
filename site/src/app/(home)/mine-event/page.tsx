import MyEventSection from '@/components/event-component/my-event-section';
import React from 'react';

const MyEvent = () => {
  return (
    <div className="px-8 pt-8 w-full min-h-screen text-white">
      <div className="flex items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-100">My Events</h1>
          <p className="text-sm text-gray-400 mt-1">
            Manage events you created, monitor real-time bidding, or finalize outcomes.
          </p>
        </div>
      </div>
      <MyEventSection />
    </div>
  );
};

export default MyEvent;