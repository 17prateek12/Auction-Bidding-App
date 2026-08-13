'use client';
import React from 'react';
import { useCreateEventStore } from '@/store/create-event-form-store';
import CreateEventDate from './create-event-date-picker';
import { TimeObject } from '@/types/create-event-type';

const EventDateTimePicker = () => {
  const { eventDate } = useCreateEventStore((s) => s.data);
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
    field: 'eventDate' | 'eventstartTime' | 'eventendTime',
    value: Date | TimeObject
  ) => {
    if (field === 'eventDate' && value instanceof Date) {
      setField('eventDate', value);
      setField('startTime', getISOTime(value, eventStartTime));
      setField('endTime', getISOTime(value, eventEndTime));
    }

    if (field === 'eventstartTime' && !(value instanceof Date)) {
      setEventStartTime(value);
      setField('startTime', getISOTime(eventDate, value));
    }

    if (field === 'eventendTime' && !(value instanceof Date)) {
      setEventEndTime(value);
      setField('endTime', getISOTime(eventDate, value));
    }
  };

  return (
    <CreateEventDate
      eventDate={eventDate}
      eventstartTime={eventStartTime}
      eventendTime={eventEndTime}
      onChange={handleFieldChange}
    />
  );
};

export default EventDateTimePicker;
