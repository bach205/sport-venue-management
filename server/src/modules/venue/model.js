const mongoose = require("mongoose");

// --- VENUE MODEL ---
const VenueSchema = new mongoose.Schema(
  {
    owner_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    name: { type: String, required: true },
    location: { type: String, required: true },
    description: { type: String },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date },
  },
  { timestamps: true, collection: "venues" }
);

// --- VENUE SLOT MODEL ---
const VenueSlotSchema = new mongoose.Schema(
  {
    venue_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Venue",
      required: true,
    },
    date: { type: Date, required: true },
    start_time: { type: String, required: true },
    end_time: { type: String, required: true },
    status: { type: String, enum: ["available", "booked", "blocked"], default: "available", required: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date },
  },
  { timestamps: true, collection: "venue_slots" }
);

// --- BOOKING MODEL ---
const BookingSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    venue_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Venue",
      required: true,
    },
    slot_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "VenueSlot",
      required: true,
    },
    status: { type: String, enum: ["booked", "cancelled", "refund_processing"], default: "booked", required: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date },
  },
  { timestamps: true, collection: "bookings" }
);

// --- PAYMENT MODEL ---
const PaymentSchema = new mongoose.Schema(
  {
    booking_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      required: true,
    },
    amount: { type: Number, required: true },
    status: { type: String, enum: ["paid", "refunded"], default: "paid", required: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date },
  },
  { timestamps: true, collection: "payments" }
);

// --- REFUND MODEL ---
const RefundSchema = new mongoose.Schema(
  {
    booking_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      required: true,
    },
    status: { type: String, enum: ["processing", "completed", "rejected"], default: "processing", required: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date },
  },
  { timestamps: true, collection: "refunds" }
);

// Middleware logic
function updateTimestamp(next) {
  this.set({ updatedAt: Date.now() });
  next();
}

const schemas = [VenueSchema, VenueSlotSchema, BookingSchema, PaymentSchema, RefundSchema];

schemas.forEach((schema) => {
  schema.pre("save", function (next) {
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
const VenueSlot = mongoose.model("VenueSlot", VenueSlotSchema);
const Booking = mongoose.model("Booking", BookingSchema);
const Payment = mongoose.model("Payment", PaymentSchema);
const Refund = mongoose.model("Refund", RefundSchema);

module.exports = { Venue, VenueSlot, Booking, Payment, Refund };
