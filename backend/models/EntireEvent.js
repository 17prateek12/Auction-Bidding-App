const mongoose = require("mongoose");

const entireEventSchema = mongoose.Schema(
  {
    eventDetails: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    items: {
      type: [mongoose.Schema.Types.Mixed],
      required: true,
    },
    bids: {
      type: [mongoose.Schema.Types.Mixed],
      required: true,
    },
  },
  {
    timestamps: true,
  }
);
module.exports = mongoose.model("EntireEvent", entireEventSchema);