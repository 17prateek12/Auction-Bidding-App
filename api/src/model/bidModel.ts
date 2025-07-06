import mongoose, { Schema } from 'mongoose';
import { IBid } from '../interface/interface';

const bidSchema = new Schema<IBid>({
  event: {
    type: Schema.Types.ObjectId,
    ref: 'Event',
    required: true
  },
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  item: {
    type: Schema.Types.ObjectId,
    ref: 'Item',
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  rank: {
    type: Number,
    required: true
  }
}, { timestamps: true });

export const Bid = mongoose.model<IBid>('Bid', bidSchema);
