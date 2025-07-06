import mongoose, { Schema } from "mongoose";
import { Aucevent } from "../interface/interface";

const eventSchema = new Schema<Aucevent>({
    eventName: {
        type: String,
        required: [true, "Please add event name"],
    },
    startTime: {
        type: Date,
        required: [true, 'Please add event start time'],
    },
    endTime: {
        type: Date,
        required: [true, 'Please add event end time'],
    },
    eventDate: {
        type: Date,
        required: [true, 'Please add event date'],
    },
    description: {
        type: String,
        default: '',
    },
    items: [
        {
            type: Schema.Types.ObjectId,
            ref: 'Item',
        }
    ],
    createdBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required:true
    },
    eventStatus: {
        type: String,
        enum: ['upcoming', 'active', 'ended'],
        default: 'upcoming',
        index:true
    },
    columns: {
        type: [String],
        required: true,
    },
}, {
    timestamps: true,
});

eventSchema.index({ status: 1 });


export default mongoose.model<Aucevent>('Event', eventSchema);