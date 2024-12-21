const mongoose = require("mongoose");

const bidSchema = mongoose.Schema(
  {
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event", // Reference to the Event model
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // Reference to the User model
      required: true,
    },
    bids: [
      {
        rowId: {
          type: String, // Reference to the row ID in the Item schema
          required: true,
        },
        amounts: [
          {
            value: {
              type: Number,
              required: [true, "Please add the bid amount"],
            },
            timestamp: {
              type: Date,
              default: Date.now, // Automatically set the timestamp when an amount is added
            },
          },
        ],
        rank: {
          type: Number, // Rank of the bidder for this specific row/item
          default: null, // Rank will be dynamically updated
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Bid", bidSchema);
