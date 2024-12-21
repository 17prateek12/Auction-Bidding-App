const mongoose = require('mongoose');

const itemSchema = mongoose.Schema(
  {
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: true,
    },
    columns: {
      type: [String], // Dynamic column names (e.g., headers from Excel)
      required: true,
    },
    rows: [
      {
        _id: { type: mongoose.Schema.Types.ObjectId, auto: true }, // Auto-generated ID for each row
        data: {
          type: Map, // Each row is a flexible Map
          of: String, // Each key-value pair in the row can be a string
          required: true,
        }
      }
    ],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Item", itemSchema);
