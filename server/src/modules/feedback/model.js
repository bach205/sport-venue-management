const mongoose = require("mongoose");

const FEEDBACK_STATUS = {
  NEW: "new",
  REVIEWING: "reviewing",
  RESOLVED: "resolved",
};

const FeedbackSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    category: {
      type: String,
      enum: ["bug", "feature_request", "billing", "support", "other"],
      required: true,
      index: true,
    },
    subject: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000,
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
      default: null,
    },
    status: {
      type: String,
      enum: Object.values(FEEDBACK_STATUS),
      default: FEEDBACK_STATUS.NEW,
      required: true,
      index: true,
    },
    reviewed_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    reviewed_at: {
      type: Date,
      default: null,
    },
    admin_note: {
      type: String,
      default: "",
      trim: true,
      maxlength: 500,
    },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date },
  },
  { timestamps: true, collection: "feedbacks" }
);

FeedbackSchema.index({ createdAt: -1 });
FeedbackSchema.index({ user_id: 1, createdAt: -1 });

function updateTimestamp(next) {
  this.set({ updatedAt: Date.now() });
  next();
}

FeedbackSchema.pre("save", function setTimestamps(next) {
  if (this.isNew) {
    this.createdAt = Date.now();
  }

  this.updatedAt = Date.now();
  next();
});

FeedbackSchema.pre("findOneAndUpdate", updateTimestamp);
FeedbackSchema.pre("updateOne", updateTimestamp);
FeedbackSchema.pre("updateMany", updateTimestamp);
FeedbackSchema.pre("findByIdAndUpdate", updateTimestamp);

const Feedback = mongoose.model("Feedback", FeedbackSchema);

module.exports = {
  Feedback,
  FEEDBACK_STATUS,
};
