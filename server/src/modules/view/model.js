const mongoose = require("mongoose");

const ViewCounterSchema = new mongoose.Schema(
  {
    target_type: {
      type: String,
      required: true,
      trim: true,
      default: "page",
    },
    target_id: {
      type: String,
      required: true,
      trim: true,
    },
    count: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  { timestamps: true, collection: "view_counters" }
);

ViewCounterSchema.index({ target_type: 1, target_id: 1 }, { unique: true });

const ViewCounter = mongoose.model("ViewCounter", ViewCounterSchema);

module.exports = { ViewCounter };
