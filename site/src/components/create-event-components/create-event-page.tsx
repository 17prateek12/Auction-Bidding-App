import React from 'react'
import CreateEventForm from './create-event-form'
import EventDateTimePicker from './event-time';
import RowColumnCreator from './row-column-creator';


const CreateEventPage = () => {
  return (
   <>
   <CreateEventForm />
   <EventDateTimePicker />
   <RowColumnCreator />
   </>
  )
}

export default CreateEventPage