import React from 'react';
import CreateEventForm from './create-event-form';
import EventDateTimePicker from './event-time';
import VirtualizedRowColumnCreator from './virtualized-row-column-creator';
import RowColumnCreator from './row-column-creator';

const CreateEventPage = () => {
  return (
    <div className="w-full space-y-6">
      <CreateEventForm />
      <EventDateTimePicker />

      <VirtualizedRowColumnCreator />
      {/* <RowColumnCreator /> */}
    </div>
  );
};

export default CreateEventPage;