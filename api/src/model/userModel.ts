import mongoose, { Schema } from "mongoose";
import { IUser } from "../interface/interface";

const userSchema = new Schema<IUser>({
    name: {
        type: String,
        required: [true, 'Please add a name'],
    },
    email: {
        type: String,
        required: [true, 'Please add a email'],
    },
    password: {
        type: String,
        required: [true, 'Pleaee put a password'],
    },
    registrationTime: {
        type: String,
        required: true,
    },
}, {
    timestamps: true,
});

export default mongoose.model<IUser>('User', userSchema);