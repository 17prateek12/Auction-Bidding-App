import CreateEventPage from '@/components/create-event-components/create-event-page';
import React from 'react';

const CreateEvent = () => {
  return (
    <div className="px-4 sm:px-8 py-8 w-full min-h-screen text-white">
      <div className="mb-6">
        <h1 className="text-3xl font-extrabold text-gray-100">Create Bidding Event</h1>
        <p className="text-sm text-gray-400 mt-1">
          Set up an auction event with custom product items or upload an Excel catalog.
        </p>
      </div>
      <CreateEventPage />
    </div>
  );
};

export default CreateEvent;