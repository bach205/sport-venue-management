const mongoose = require("mongoose");

const ACTIVE_BOOKING_STATUSES = ["hold", "payment_pending", "confirmed", "refund_processing"];
const BOOKING_STATUSES = [
  ...ACTIVE_BOOKING_STATUSES,
  "refunded",
  "refund_rejected",
  "expired",
];
const PAYMENT_STATUSES = ["pending", "paid", "failed", "refund_pending", "refunded"];
const REFUND_STATUSES = ["pending_auto", "pending_manual", "approved", "rejected", "completed"];

const timePattern = /^([01]\d|2[0-3]):([0-5]\d)$/;
const datePattern = /^\d{4}-\d{2}-\d{2}$/;

const WeeklyScheduleSchema = new mongoose.Schema(
  {
    day_of_week: {
      type: Number,
      min: 0,
      max: 6,
      required: true,
    },
    start_time: {
      type: String,
      required: true,
      match: timePattern,
    },
    end_time: {
      type: String,
      required: true,
      match: timePattern,
    },
  },
  { _id: false }
);

const VenueSchema = new mongoose.Schema(
  {
    owner_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    name: { type: String, required: true, trim: true },
    location: { type: String, required: true, trim: true },
    description: { type: String, default: "", trim: true },
    phone_number: { type: String, required: true, trim: true },
    image_url: { type: String, default: "", trim: true },
    slot_price: { type: Number, required: true, min: 0 },
    slot_duration_minutes: { type: Number, required: true, min: 15 },
    weekly_schedule: {
      type: [WeeklyScheduleSchema],
      default: [],
    },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date },
  },
  { timestamps: true, collection: "venues" }
);

const VenueAvailabilityOverrideSchema = new mongoose.Schema(
  {
    venue_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Venue",
      required: true,
      index: true,
    },
    date: {
      type: String,
      required: true,
      match: datePattern,
    },
    start_time: {
      type: String,
      required: true,
      match: timePattern,
    },
    end_time: {
      type: String,
      required: true,
      match: timePattern,
    },
    status: {
      type: String,
      enum: ["unavailable"],
      default: "unavailable",
      required: true,
    },
    created_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    reason: { type: String, default: "", trim: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date },
  },
  { timestamps: true, collection: "venue_availability_overrides" }
);

VenueAvailabilityOverrideSchema.index(
  { venue_id: 1, date: 1, start_time: 1, end_time: 1 },
  { unique: true }
);

const BookingSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    venue_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Venue",
      required: true,
      index: true,
    },
    date: {
      type: String,
      required: true,
      match: datePattern,
    },
    start_time: {
      type: String,
      required: true,
      match: timePattern,
    },
    end_time: {
      type: String,
      required: true,
      match: timePattern,
    },
    amount: { type: Number, required: true, min: 0 },
    slot_count: { type: Number, required: true, min: 1, default: 1 },
    status: {
      type: String,
      enum: BOOKING_STATUSES,
      default: "hold",
      required: true,
    },
    hold_expires_at: {
      type: Date,
      required: true,
      index: true,
    },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date },
  },
  { timestamps: true, collection: "bookings" }
);

const BookingItemSchema = new mongoose.Schema(
  {
    booking_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      required: true,
      index: true,
    },
    venue_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Venue",
      required: true,
      index: true,
    },
    date: {
      type: String,
      required: true,
      match: datePattern,
      index: true,
    },
    start_time: {
      type: String,
      required: true,
      match: timePattern,
    },
    end_time: {
      type: String,
      required: true,
      match: timePattern,
    },
    amount: { type: Number, required: true, min: 0 },
    booking_status: {
      type: String,
      enum: BOOKING_STATUSES,
      default: "hold",
      required: true,
      index: true,
    },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date },
  },
  { timestamps: true, collection: "booking_items" }
);

BookingItemSchema.index(
  { venue_id: 1, date: 1, start_time: 1, end_time: 1 },
  {
    unique: true,
    partialFilterExpression: {
      booking_status: { $in: ACTIVE_BOOKING_STATUSES },
    },
    name: "unique_active_slot_booking_item",
  }
);

const PaymentSchema = new mongoose.Schema(
  {
    booking_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      required: true,
      unique: true,
    },
    amount: { type: Number, required: true, min: 0 },
    provider: { type: String, default: "stub", required: true, trim: true },
    status: {
      type: String,
      enum: PAYMENT_STATUSES,
      default: "pending",
      required: true,
    },
    provider_reference: { type: String, default: "", trim: true },
    paid_at: { type: Date, default: null },
    refunded_at: { type: Date, default: null },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date },
  },
  { timestamps: true, collection: "payments" }
);

const RefundSchema = new mongoose.Schema(
  {
    booking_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      required: true,
      index: true,
    },
    payment_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Payment",
      required: true,
    },
    requested_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    processed_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    type: {
      type: String,
      enum: ["auto", "manual"],
      required: true,
    },
    status: {
      type: String,
      enum: REFUND_STATUSES,
      default: "pending_manual",
      required: true,
    },
    note: { type: String, default: "", trim: true },
    processed_at: { type: Date, default: null },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date },
  },
  { timestamps: true, collection: "refunds" }
);

function updateTimestamp(next) {
  this.set({ updatedAt: Date.now() });
  next();
}

[
  VenueSchema,
  VenueAvailabilityOverrideSchema,
  BookingSchema,
  BookingItemSchema,
  PaymentSchema,
  RefundSchema,
].forEach((schema) => {
  schema.pre("save", function saveHook(next) {
    if (this.isNew) {
      this.createdAt = Date.now();
    }

    this.updatedAt = Date.now();
    next();
  });

  schema.pre("findOneAndUpdate", updateTimestamp);
  schema.pre("updateOne", updateTimestamp);
  schema.pre("updateMany", updateTimestamp);
  schema.pre("findByIdAndUpdate", updateTimestamp);
});

const Venue = mongoose.model("Venue", VenueSchema);
const VenueAvailabilityOverride = mongoose.model(
  "VenueAvailabilityOverride",
  VenueAvailabilityOverrideSchema
);
const Booking = mongoose.model("Booking", BookingSchema);
const BookingItem = mongoose.model("BookingItem", BookingItemSchema);
const Payment = mongoose.model("Payment", PaymentSchema);
const Refund = mongoose.model("Refund", RefundSchema);

module.exports = {
  ACTIVE_BOOKING_STATUSES,
  BOOKING_STATUSES,
  PAYMENT_STATUSES,
  REFUND_STATUSES,
  Venue,
  VenueAvailabilityOverride,
  Booking,
  BookingItem,
  Payment,
  Refund,
};
