const mongoose = require("mongoose");

const eventSchema = mongoose.Schema(
  {
    eventName: {
      type: String,
      required: [true, "Please add the event name"],
    },
    startTime: {
      type: Date,
      required: [true, "Please add the start time"],
    },
    endTime: {
      type: Date,
      required: [true, "Please add the end time"],
    },
    eventDate: {
      type: Date,
      required: [true, "Please add the end time"],
    },
    description: {
      type: String,
      default: "",
    },
    items: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Item",
      },
    ],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Event", eventSchema);