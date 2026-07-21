import { convertToIST } from "./istTime";

export const updateEventStatus = async (event: any): Promise<'upcoming' | 'active' | 'ended'> => {
  const now = convertToIST(new Date());
  
  const startTimeObj = new Date(event.startTime);
  const endTimeObj = new Date(event.endTime);
  const eventDateObj = new Date(event.eventDate);

  const eventStart = new Date(eventDateObj);
  eventStart.setHours(startTimeObj.getHours(), startTimeObj.getMinutes(), startTimeObj.getSeconds());

  const eventEnd = new Date(eventDateObj);
  eventEnd.setHours(endTimeObj.getHours(), endTimeObj.getMinutes(), endTimeObj.getSeconds());

  const startIst = convertToIST(eventStart);
  const endIst = convertToIST(eventEnd);

  let newStatus: 'upcoming' | 'active' | 'ended';

  if (now < startIst) {
    newStatus = 'upcoming';
  } else if (now >= startIst && now < endIst) {
    newStatus = 'active';
  } else {
    newStatus = 'ended';
  }

  if (event.eventStatus !== newStatus && typeof event.save === 'function') {
    event.eventStatus = newStatus;
    await event.save();
  }

  return newStatus;
};
