import React from 'react';
import CreateEventForm from './create-event-form';
import EventDateTimePicker from './event-time';
import VirtualizedRowColumnCreator from './virtualized-row-column-creator';
const CreateEventPage = () => {
  return (
    <div className="w-full space-y-6">
      <CreateEventForm />
      <EventDateTimePicker />

      <VirtualizedRowColumnCreator />
    </div>
  );
};

export default CreateEventPage;