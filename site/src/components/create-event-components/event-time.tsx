'use client'
import React from "react";
import { useCreateEventStore } from "@/store/create-event-form-store";
import CreateEventDate from "./create-event-date-picker";
import { EventForm, TimeObject } from "@/types/create-event-type";

const EventDateTimePicker = () => {

  const { eventDate, endDate } = useCreateEventStore((s) => s.data);
  const setField = useCreateEventStore((s) => s.setField);

  const [eventStartTime, setEventStartTime] = React.useState<TimeObject>({ hours: 9, minutes: 0 });
  const [eventEndTime, setEventEndTime] = React.useState<TimeObject>({ hours: 12, minutes: 0 });

  const getISOTime = (date: Date | undefined, time: TimeObject): string | undefined => {
    if (!date) return undefined;
    const dt = new Date(date);
    dt.setHours(time.hours);
    dt.setMinutes(time.minutes);
    dt.setSeconds(0);
    dt.setMilliseconds(0);
    return dt.toISOString();
  };

  const handleFieldChange = (
    field: keyof EventForm | 'eventstartTime' | 'eventendTime',
    value: any
  ) => {
    if (field === 'eventDate') {
      setField('eventDate', value);
      setField('startTime', getISOTime(value, eventStartTime));
      if (endDate) {
        setField('endTime', getISOTime(endDate, eventEndTime));
      }
    }

    if (field === 'endDate') {
      setField('endDate', value);
      setField('endTime', getISOTime(value, eventEndTime));
    }

    if (field === 'eventstartTime') {
      setEventStartTime(value);
      setField('startTime', getISOTime(eventDate, value));
    }

    if (field === 'eventendTime') {
      setEventEndTime(value);
      setField('endTime', getISOTime(endDate ?? eventDate, value));
    }
  };

  return (
    <CreateEventDate
      startDate={eventDate}
      endDate={endDate}
      eventstartTime={eventStartTime}
      eventendTime={eventEndTime}
      onChange={handleFieldChange}
    />
  )
};



export default EventDateTimePicker;
