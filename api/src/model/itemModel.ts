import mongoose, { Schema } from "mongoose";
import { IItems } from "../interface/interface";

const itemSchema = new Schema<IItems>({
    eventId: {
        type: Schema.Types.ObjectId,
        ref: 'Event',
        required: true,
    },
    columnData: {
        type: Map,
        of: Schema.Types.Mixed,
        required: true,
    },
    createdBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
    },
}, {
    timestamps: true,
});

export default mongoose.model<IItems>("Item", itemSchema);
