import { Document } from "mongoose";
import { convertToIST } from "./istTime";


export const updateEventStatus = async (event: Document & any): Promise<'upcoming' | 'active' | 'ended'> => {
    const now = convertToIST(new Date());
    const eventstart = new Date(event.eventDate);
    eventstart.setHours(event.startTime.getHours());
    eventstart.setMinutes(event.startTime.getMinutes());
    eventstart.setSeconds(event.startTime.getSeconds());

    const eventend = new Date(event.eventDate);
    eventend.setHours(event.endTime.getHours());
    eventend.setMinutes(event.endTime.getMinutes());
    eventend.setSeconds(event.endTime.getSeconds());

    const startIst = convertToIST(eventstart);
    const endIst = convertToIST(eventend)
    console.log("Event name:", event.eventName);
    console.log("NOW:", now.toISOString());
    console.log("Start IST:", startIst.toISOString(),"given req start time",eventstart.toISOString());
    console.log("End IST:", endIst.toISOString(),'give req end time',eventend.toISOString());

    let newStatus: 'upcoming' | 'active' | 'ended';

    if (now < startIst) {
        newStatus = 'upcoming';
    } else if (now > startIst && now < endIst) {
        newStatus = 'active';
    } else {
        newStatus = 'ended';
    }

    if (event.status !== newStatus) {
        event.status = newStatus;
        await event.save();
    }

    return newStatus;
}

