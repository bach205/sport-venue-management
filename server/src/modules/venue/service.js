const { HTTP_STATUS } = require("../../constants");
const createHttpError = require("../../utils/createHttpError");
const {
  Venue,
  VenueAvailabilityOverride,
  Booking,
  Payment,
  Refund,
} = require("./model");
const { Profile } = require("../user/model");

const HOLD_TTL_MS = 5 * 60 * 1000;
const AUTO_REFUND_WINDOW_MS = 5 * 60 * 1000;
const EXPIRED_BOOKING_STATUSES = ["hold", "payment_pending"];
const ACTIVE_BOOKING_QUERY_STATUSES = ["hold", "payment_pending", "confirmed", "refund_processing"];
const BOOKING_STATUS_TO_SLOT_STATUS = {
  hold: "held",
  payment_pending: "booked",
  confirmed: "booked",
  refund_processing: "refund_processing",
};

const buildPagination = (page, limit, total) => ({
  page,
  limit,
  total,
  pages: Math.ceil(total / limit),
});

const timeToMinutes = (time) => {
  const [hours, minutes] = String(time).split(":").map(Number);
  return (hours * 60) + minutes;
};

const minutesToTime = (minutes) => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
};

const getDayOfWeek = (dateString) => {
  const localDate = new Date(`${dateString}T00:00:00`);
  return localDate.getDay();
};

const buildSlotKey = (date, startTime, endTime) => `${date}|${startTime}|${endTime}`;

class VenueService {
  async createVenue(ownerId, payload) {
    const venue = await Venue.create({
      owner_id: ownerId,
      name: payload.name,
      location: payload.location,
      description: payload.description,
      slot_price: payload.slot_price,
      slot_duration_minutes: payload.slot_duration_minutes,
      weekly_schedule: payload.weekly_schedule,
    });

    return this.formatVenue(venue);
  }

  async listVenues(page = 1, limit = 20, date) {
    const skip = (page - 1) * limit;
    const [venues, total] = await Promise.all([
      Venue.find({})
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Venue.countDocuments({}),
    ]);

    if (!date) {
      return {
        items: venues.map((venue) => this.formatVenue(venue)),
        pagination: buildPagination(page, limit, total),
      };
    }

    await this.expireStaleBookings({ date });

    const venueIds = venues.map((venue) => venue._id);
    const [overrides, activeBookings] = await Promise.all([
      VenueAvailabilityOverride.find({
        venue_id: { $in: venueIds },
        date,
      }),
      Booking.find({
        venue_id: { $in: venueIds },
        date,
        status: { $in: ACTIVE_BOOKING_QUERY_STATUSES },
      }),
    ]);

    const overridesByVenueId = new Map();
    const bookingsByVenueId = new Map();

    overrides.forEach((override) => {
      const key = String(override.venue_id);
      const current = overridesByVenueId.get(key) || [];
      current.push(override);
      overridesByVenueId.set(key, current);
    });

    activeBookings.forEach((booking) => {
      const key = String(booking.venue_id);
      const current = bookingsByVenueId.get(key) || [];
      current.push(booking);
      bookingsByVenueId.set(key, current);
    });

    return {
      items: venues.map((venue) => {
        const venueOverrides = overridesByVenueId.get(String(venue._id)) || [];
        const venueBookings = bookingsByVenueId.get(String(venue._id)) || [];
        const slots = this.buildSlotsForDate(venue, date, venueOverrides, venueBookings);

        return {
          ...this.formatVenue(venue),
          availabilitySummary: this.buildAvailabilitySummary(date, slots),
        };
      }),
      pagination: buildPagination(page, limit, total),
    };
  }

  async getVenueSlots(venueId, date) {
    await this.expireStaleBookings({ venue_id: venueId, date });

    const venue = await this.getVenueOrThrow(venueId);
    const [overrides, activeBookings] = await Promise.all([
      VenueAvailabilityOverride.find({ venue_id: venueId, date }),
      Booking.find({
        venue_id: venueId,
        date,
        status: { $in: ACTIVE_BOOKING_QUERY_STATUSES },
      }),
    ]);

    const slots = this.buildSlotsForDate(venue, date, overrides, activeBookings);

    return {
      venue: this.formatVenue(venue),
      date,
      slots,
    };
  }

  async createBookingHold(userId, payload) {
    await this.expireStaleBookings({ venue_id: payload.venue_id, date: payload.date });

    const venue = await this.getVenueOrThrow(payload.venue_id);
    const matchedSlot = this.assertSlotExistsInSchedule(
      venue,
      payload.date,
      payload.start_time,
      payload.end_time
    );

    const existingOverride = await VenueAvailabilityOverride.findOne({
      venue_id: venue._id,
      date: payload.date,
      start_time: payload.start_time,
      end_time: payload.end_time,
    });

    if (existingOverride) {
      throw createHttpError(HTTP_STATUS.BAD_REQUEST, "This slot is unavailable.");
    }

    const activeBooking = await Booking.findOne({
      venue_id: venue._id,
      date: payload.date,
      start_time: payload.start_time,
      end_time: payload.end_time,
      status: { $in: ACTIVE_BOOKING_QUERY_STATUSES },
    });

    if (activeBooking) {
      throw createHttpError(HTTP_STATUS.BAD_REQUEST, "This slot is no longer available.");
    }

    try {
      const booking = await Booking.create({
        user_id: userId,
        venue_id: venue._id,
        date: matchedSlot.date,
        start_time: matchedSlot.start_time,
        end_time: matchedSlot.end_time,
        amount: venue.slot_price,
        status: "hold",
        hold_expires_at: new Date(Date.now() + HOLD_TTL_MS),
      });

      return {
        booking: this.formatBooking(booking, {
          venue,
        }),
      };
    } catch (error) {
      if (error?.code === 11000) {
        throw createHttpError(HTTP_STATUS.BAD_REQUEST, "This slot is no longer available.");
      }

      throw error;
    }
  }

  async createPayment(userId, bookingId, payload) {
    await this.expireStaleBookings({ _id: bookingId });

    const booking = await this.getBookingOrThrow(bookingId);
    this.assertOwnership(booking.user_id, userId, "You can only pay for your own booking.");

    if (booking.status !== "hold") {
      throw createHttpError(
        HTTP_STATUS.BAD_REQUEST,
        "Payment can only be created for a booking that is on hold."
      );
    }

    if (booking.hold_expires_at.getTime() < Date.now()) {
      booking.status = "expired";
      await booking.save();
      throw createHttpError(HTTP_STATUS.BAD_REQUEST, "This booking hold has expired.");
    }

    const existingPayment = await Payment.findOne({ booking_id: booking._id });
    if (existingPayment) {
      throw createHttpError(HTTP_STATUS.BAD_REQUEST, "A payment already exists for this booking.");
    }

    booking.status = "payment_pending";
    await booking.save();

    const payment = await Payment.create({
      booking_id: booking._id,
      amount: booking.amount,
      provider: payload.provider,
      provider_reference: payload.provider_reference,
      status: "pending",
    });

    const venue = await this.getVenueOrThrow(booking.venue_id);

    return {
      booking: this.formatBooking(booking, { venue }),
      payment: this.formatPayment(payment),
    };
  }

  async confirmPayment(userId, paymentId, payload) {
    const payment = await Payment.findById(paymentId);
    if (!payment) {
      throw createHttpError(HTTP_STATUS.NOT_FOUND, "Payment not found.");
    }

    const booking = await this.getBookingOrThrow(payment.booking_id);
    this.assertOwnership(booking.user_id, userId, "You can only confirm your own payment.");

    return this.processPaymentSettlement({
      paymentId,
      provider: payment.provider,
      provider_reference: payload.provider_reference,
      status: payload.status,
      paid_at: payload.paid_at,
    });
  }

  async handlePaymentWebhook(provider, payload) {
    return this.processPaymentSettlement({
      paymentId: payload.payment_id,
      provider,
      provider_reference: payload.provider_reference,
      status: payload.status,
      paid_at: payload.paid_at,
    });
  }

  async processPaymentSettlement(payload) {
    const payment = await this.resolvePaymentForSettlement(payload);
    const booking = await this.getBookingOrThrow(payment.booking_id);

    await this.expireStaleBookings({ _id: booking._id });

    const latestBooking = await this.getBookingOrThrow(booking._id);
    const latestPayment = await Payment.findById(payment._id);
    const venue = await this.getVenueOrThrow(latestBooking.venue_id);

    if (payload.status === "paid") {
      return this.settleSuccessfulPayment(latestBooking, latestPayment, venue, payload);
    }

    return this.settleFailedPayment(latestBooking, latestPayment, venue);
  }

  async resolvePaymentForSettlement(payload) {
    if (payload.paymentId) {
      const payment = await Payment.findById(payload.paymentId);
      if (!payment) {
        throw createHttpError(HTTP_STATUS.NOT_FOUND, "Payment not found.");
      }
      return payment;
    }

    if (payload.provider_reference) {
      const payment = await Payment.findOne({
        provider: payload.provider,
        provider_reference: payload.provider_reference,
      });
      if (!payment) {
        throw createHttpError(HTTP_STATUS.NOT_FOUND, "Payment not found.");
      }
      return payment;
    }

    throw createHttpError(HTTP_STATUS.BAD_REQUEST, "Payment reference is required.");
  }

  async settleSuccessfulPayment(booking, payment, venue, payload) {
    if (payment.status === "paid" && booking.status === "confirmed") {
      return {
        acknowledged: true,
        booking: this.formatBooking(booking, { venue }),
        payment: this.formatPayment(payment),
      };
    }

    if (booking.status !== "payment_pending" || payment.status !== "pending") {
      return {
        acknowledged: true,
        booking: this.formatBooking(booking, { venue }),
        payment: this.formatPayment(payment),
      };
    }

    if (booking.hold_expires_at.getTime() < Date.now()) {
      booking.status = "expired";
      payment.status = "failed";
      await Promise.all([booking.save(), payment.save()]);

      return {
        acknowledged: true,
        booking: this.formatBooking(booking, { venue }),
        payment: this.formatPayment(payment),
      };
    }

    payment.status = "paid";
    payment.provider_reference = payload.provider_reference || payment.provider_reference || payment.id;
    payment.paid_at = payload.paid_at ? new Date(payload.paid_at) : (payment.paid_at || new Date());
    booking.status = "confirmed";

    await Promise.all([payment.save(), booking.save()]);

    return {
      acknowledged: true,
      booking: this.formatBooking(booking, { venue }),
      payment: this.formatPayment(payment),
    };
  }

  async settleFailedPayment(booking, payment, venue) {
    if (["failed", "refunded"].includes(payment.status) || booking.status === "expired") {
      return {
        acknowledged: true,
        booking: this.formatBooking(booking, { venue }),
        payment: this.formatPayment(payment),
      };
    }

    if (booking.status === "payment_pending" && payment.status === "pending") {
      payment.status = "failed";
      booking.status = "expired";
      await Promise.all([payment.save(), booking.save()]);
    }

    return {
      acknowledged: true,
      booking: this.formatBooking(booking, { venue }),
      payment: this.formatPayment(payment),
    };
  }

  async requestRefund(userId, bookingId, payload) {
    const booking = await this.getBookingOrThrow(bookingId);
    this.assertOwnership(booking.user_id, userId, "You can only refund your own booking.");

    if (booking.status !== "confirmed") {
      throw createHttpError(
        HTTP_STATUS.BAD_REQUEST,
        "Only confirmed bookings can request a refund."
      );
    }

    const payment = await this.getPaymentForBookingOrThrow(booking._id);
    if (payment.status !== "paid" || !payment.paid_at) {
      throw createHttpError(HTTP_STATUS.BAD_REQUEST, "This booking has no paid payment to refund.");
    }

    const existingRefund = await Refund.findOne({
      booking_id: booking._id,
      status: { $in: ["pending_auto", "pending_manual", "approved", "completed"] },
    });

    if (existingRefund) {
      throw createHttpError(
        HTTP_STATUS.BAD_REQUEST,
        "A refund has already been requested for this booking."
      );
    }

    const venue = await this.getVenueOrThrow(booking.venue_id);
    const isAutoRefund = (Date.now() - payment.paid_at.getTime()) <= AUTO_REFUND_WINDOW_MS;

    if (isAutoRefund) {
      booking.status = "refund_processing";
      payment.status = "refund_pending";
      await Promise.all([booking.save(), payment.save()]);

      const refund = await Refund.create({
        booking_id: booking._id,
        payment_id: payment._id,
        requested_by: userId,
        type: "auto",
        status: "pending_auto",
        note: payload.note,
      });

      payment.status = "refunded";
      payment.refunded_at = new Date();
      booking.status = "refunded";
      refund.status = "completed";
      refund.processed_at = new Date();

      await Promise.all([payment.save(), booking.save(), refund.save()]);

      return {
        mode: "auto",
        booking: this.formatBooking(booking, { venue }),
        payment: this.formatPayment(payment),
        refund: this.formatRefund(refund),
      };
    }

    const refund = await Refund.create({
      booking_id: booking._id,
      payment_id: payment._id,
      requested_by: userId,
      type: "manual",
      status: "pending_manual",
      note: payload.note,
    });

    return {
      mode: "manual",
      booking: this.formatBooking(booking, { venue }),
      payment: this.formatPayment(payment),
      refund: this.formatRefund(refund),
    };
  }

  async getMyBookings(userId, page = 1, limit = 20, status) {
    await this.expireStaleBookings({ user_id: userId });

    const filter = { user_id: userId };
    if (status) {
      filter.status = status;
    }

    return this.getBookingCollection(filter, page, limit, { includeUser: false });
  }

  async getMyBookingById(userId, bookingId) {
    await this.expireStaleBookings({ _id: bookingId, user_id: userId });

    const booking = await Booking.findOne({ _id: bookingId, user_id: userId });
    if (!booking) {
      throw createHttpError(HTTP_STATUS.NOT_FOUND, "Booking not found.");
    }

    return this.getBookingDetail(booking);
  }

  async getMyVenues(ownerId) {
    const venues = await Venue.find({ owner_id: ownerId }).sort({ createdAt: -1 });
    return {
      items: venues.map((venue) => this.formatVenue(venue)),
    };
  }

  async updateVenue(ownerId, venueId, payload) {
    const venue = await this.getOwnedVenueOrThrow(ownerId, venueId);

    Object.assign(venue, payload);
    await venue.save();

    return this.formatVenue(venue);
  }

  async deleteVenue(ownerId, venueId) {
    const venue = await this.getOwnedVenueOrThrow(ownerId, venueId);
    const relatedBookingCount = await Booking.countDocuments({ venue_id: venue._id });

    if (relatedBookingCount > 0) {
      throw createHttpError(
        HTTP_STATUS.BAD_REQUEST,
        "This venue cannot be deleted because it already has booking history."
      );
    }

    await Promise.all([
      VenueAvailabilityOverride.deleteMany({ venue_id: venue._id }),
      Venue.deleteOne({ _id: venue._id }),
    ]);

    return {
      id: String(venue._id),
    };
  }

  async updateVenueSchedule(ownerId, venueId, payload) {
    const venue = await this.getOwnedVenueOrThrow(ownerId, venueId);

    venue.weekly_schedule = payload.weekly_schedule;
    venue.slot_price = payload.slot_price;
    venue.slot_duration_minutes = payload.slot_duration_minutes;
    await venue.save();

    return this.formatVenue(venue);
  }

  async updateAvailability(ownerId, venueId, payload) {
    await this.expireStaleBookings({ venue_id: venueId, date: payload.date });

    const venue = await this.getOwnedVenueOrThrow(ownerId, venueId);
    this.assertSlotExistsInSchedule(venue, payload.date, payload.start_time, payload.end_time);

    if (payload.status === "unavailable") {
      const activeBooking = await Booking.findOne({
        venue_id: venue._id,
        date: payload.date,
        start_time: payload.start_time,
        end_time: payload.end_time,
        status: { $in: ACTIVE_BOOKING_QUERY_STATUSES },
      });

      if (activeBooking) {
        throw createHttpError(
          HTTP_STATUS.BAD_REQUEST,
          "This slot already has an active booking and cannot be marked unavailable."
        );
      }

      await VenueAvailabilityOverride.findOneAndUpdate(
        {
          venue_id: venue._id,
          date: payload.date,
          start_time: payload.start_time,
          end_time: payload.end_time,
        },
        {
          venue_id: venue._id,
          date: payload.date,
          start_time: payload.start_time,
          end_time: payload.end_time,
          status: "unavailable",
          created_by: ownerId,
          reason: payload.reason,
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
    } else {
      await VenueAvailabilityOverride.findOneAndDelete({
        venue_id: venue._id,
        date: payload.date,
        start_time: payload.start_time,
        end_time: payload.end_time,
      });
    }

    const slotData = await this.getVenueSlots(venueId, payload.date);
    const slot = slotData.slots.find(
      (item) =>
        item.startTime === payload.start_time &&
        item.endTime === payload.end_time
    );

    return {
      venue: slotData.venue,
      date: payload.date,
      slot,
    };
  }

  async getVenueBookings(ownerId, venueId, query) {
    const venue = await this.getOwnedVenueOrThrow(ownerId, venueId);
    await this.expireStaleBookings({ venue_id: venueId });

    const filter = { venue_id: venueId };
    if (query.date) {
      filter.date = query.date;
    }
    if (query.status) {
      filter.status = query.status;
    }

    const result = await this.getBookingCollection(filter, query.page, query.limit, {
      includeUser: true,
    });

    return {
      venue: this.formatVenue(venue),
      ...result,
    };
  }

  async getVenueRefundRequests(ownerId, venueId, query) {
    await this.getOwnedVenueOrThrow(ownerId, venueId);

    const bookingIds = await Booking.find({ venue_id: venueId }).distinct("_id");
    const filter = {
      booking_id: { $in: bookingIds },
    };

    if (query.status) {
      filter.status = query.status;
    }

    const skip = (query.page - 1) * query.limit;
    const [refunds, total] = await Promise.all([
      Refund.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(query.limit),
      Refund.countDocuments(filter),
    ]);

    const items = await this.formatRefundCollection(refunds, { includeUser: true });

    return {
      items,
      pagination: buildPagination(query.page, query.limit, total),
    };
  }

  async resolveManualRefund(ownerId, refundId, payload) {
    const refund = await Refund.findById(refundId);
    if (!refund) {
      throw createHttpError(HTTP_STATUS.NOT_FOUND, "Refund request not found.");
    }

    const booking = await this.getBookingOrThrow(refund.booking_id);
    const [payment, venue] = await Promise.all([
      this.getPaymentForBookingOrThrow(booking._id),
      this.getOwnedVenueOrThrow(ownerId, booking.venue_id),
    ]);

    if (refund.status !== "pending_manual") {
      throw createHttpError(
        HTTP_STATUS.BAD_REQUEST,
        "Only pending manual refund requests can be processed."
      );
    }

    if (payload.action === "approve") {
      booking.status = "refund_processing";
      payment.status = "refund_pending";
      refund.status = "approved";
      refund.processed_by = ownerId;
      refund.note = payload.note || refund.note;
      await Promise.all([booking.save(), payment.save(), refund.save()]);

      booking.status = "refunded";
      payment.status = "refunded";
      payment.refunded_at = new Date();
      refund.status = "completed";
      refund.processed_at = new Date();
      await Promise.all([booking.save(), payment.save(), refund.save()]);
    } else {
      refund.status = "rejected";
      refund.processed_by = ownerId;
      refund.processed_at = new Date();
      refund.note = payload.note || refund.note;
      booking.status = "confirmed";
      await Promise.all([booking.save(), refund.save()]);
    }

    return {
      venue: this.formatVenue(venue),
      booking: this.formatBooking(booking, { venue }),
      payment: this.formatPayment(payment),
      refund: this.formatRefund(refund),
    };
  }

  async expireStaleBookings(filter = {}) {
    const staleBookings = await Booking.find({
      ...filter,
      status: { $in: EXPIRED_BOOKING_STATUSES },
      hold_expires_at: { $lt: new Date() },
    }).select("_id");

    if (staleBookings.length === 0) {
      return;
    }

    const bookingIds = staleBookings.map((booking) => booking._id);
    await Promise.all([
      Booking.updateMany(
        { _id: { $in: bookingIds } },
        { $set: { status: "expired" } }
      ),
      Payment.updateMany(
        {
          booking_id: { $in: bookingIds },
          status: "pending",
        },
        { $set: { status: "failed" } }
      ),
    ]);
  }

  async getVenueOrThrow(venueId) {
    const venue = await Venue.findById(venueId);
    if (!venue) {
      throw createHttpError(HTTP_STATUS.NOT_FOUND, "Venue not found.");
    }

    return venue;
  }

  async getOwnedVenueOrThrow(ownerId, venueId) {
    const venue = await Venue.findOne({ _id: venueId, owner_id: ownerId });
    if (!venue) {
      throw createHttpError(HTTP_STATUS.NOT_FOUND, "Venue not found for this owner.");
    }

    return venue;
  }

  async getBookingOrThrow(bookingId) {
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      throw createHttpError(HTTP_STATUS.NOT_FOUND, "Booking not found.");
    }

    return booking;
  }

  async getPaymentForBookingOrThrow(bookingId) {
    const payment = await Payment.findOne({ booking_id: bookingId });
    if (!payment) {
      throw createHttpError(HTTP_STATUS.NOT_FOUND, "Payment not found for this booking.");
    }

    return payment;
  }

  buildSlotsForDate(venue, date, overrides = [], activeBookings = []) {
    const generatedSlots = this.generateScheduleSlots(venue, date);
    const overrideSet = new Set(
      overrides.map((item) => buildSlotKey(item.date, item.start_time, item.end_time))
    );
    const bookingMap = new Map(
      activeBookings.map((booking) => [
        buildSlotKey(booking.date, booking.start_time, booking.end_time),
        booking,
      ])
    );

    return generatedSlots.map((slot) => {
      const key = buildSlotKey(slot.date, slot.start_time, slot.end_time);
      const booking = bookingMap.get(key);
      const hasOverride = overrideSet.has(key);
      const status = hasOverride
        ? "unavailable"
        : booking
          ? (BOOKING_STATUS_TO_SLOT_STATUS[booking.status] || "booked")
          : "available";

      return {
        date: slot.date,
        startTime: slot.start_time,
        endTime: slot.end_time,
        status,
        bookingId: booking ? String(booking._id) : null,
      };
    });
  }

  buildAvailabilitySummary(date, slots = []) {
    return slots.reduce(
      (summary, slot) => {
        summary.totalSlots += 1;

        if (slot.status === "available") {
          summary.availableSlots += 1;
        } else if (slot.status === "held") {
          summary.heldSlots += 1;
        } else if (slot.status === "booked" || slot.status === "refund_processing") {
          summary.bookedSlots += 1;
        } else if (slot.status === "unavailable") {
          summary.unavailableSlots += 1;
        }

        return summary;
      },
      {
        date,
        totalSlots: 0,
        availableSlots: 0,
        heldSlots: 0,
        bookedSlots: 0,
        unavailableSlots: 0,
      }
    );
  }

  generateScheduleSlots(venue, date) {
    const dayOfWeek = getDayOfWeek(date);
    const matchingSchedule = venue.weekly_schedule.filter(
      (item) => item.day_of_week === dayOfWeek
    );

    return matchingSchedule.flatMap((range) => {
      const start = timeToMinutes(range.start_time);
      const end = timeToMinutes(range.end_time);
      const slots = [];

      for (
        let current = start;
        current + venue.slot_duration_minutes <= end;
        current += venue.slot_duration_minutes
      ) {
        slots.push({
          date,
          start_time: minutesToTime(current),
          end_time: minutesToTime(current + venue.slot_duration_minutes),
        });
      }

      return slots;
    });
  }

  assertSlotExistsInSchedule(venue, date, startTime, endTime) {
    const slot = this.generateScheduleSlots(venue, date).find(
      (item) => item.start_time === startTime && item.end_time === endTime
    );

    if (!slot) {
      throw createHttpError(
        HTTP_STATUS.BAD_REQUEST,
        "The selected slot is not part of this venue schedule."
      );
    }

    return slot;
  }

  async getBookingCollection(filter, page, limit, options = {}) {
    const skip = (page - 1) * limit;
    const [bookings, total] = await Promise.all([
      Booking.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Booking.countDocuments(filter),
    ]);

    const items = await this.formatBookingCollection(bookings, options);

    return {
      items,
      pagination: buildPagination(page, limit, total),
    };
  }

  async getBookingDetail(booking) {
    const [venue, payment, refund, userInfo] = await Promise.all([
      this.getVenueOrThrow(booking.venue_id),
      Payment.findOne({ booking_id: booking._id }),
      Refund.findOne({ booking_id: booking._id }).sort({ createdAt: -1 }),
      this.getUserSummary(booking.user_id),
    ]);

    return {
      ...this.formatBooking(booking, { venue, user: userInfo }),
      payment: payment ? this.formatPayment(payment) : null,
      refund: refund ? this.formatRefund(refund) : null,
    };
  }

  async formatBookingCollection(bookings, options = {}) {
    if (bookings.length === 0) {
      return [];
    }

    const venueIds = [...new Set(bookings.map((booking) => String(booking.venue_id)))];
    const bookingIds = bookings.map((booking) => booking._id);
    const userIds = options.includeUser
      ? [...new Set(bookings.map((booking) => String(booking.user_id)))]
      : [];

    const [venues, payments, refunds, users] = await Promise.all([
      Venue.find({ _id: { $in: venueIds } }),
      Payment.find({ booking_id: { $in: bookingIds } }),
      Refund.find({ booking_id: { $in: bookingIds } }).sort({ createdAt: -1 }),
      options.includeUser ? this.getUserSummaries(userIds) : Promise.resolve(new Map()),
    ]);

    const venueMap = new Map(venues.map((venue) => [String(venue._id), venue]));
    const paymentMap = new Map(payments.map((payment) => [String(payment.booking_id), payment]));
    const refundMap = new Map();

    refunds.forEach((refund) => {
      const key = String(refund.booking_id);
      if (!refundMap.has(key)) {
        refundMap.set(key, refund);
      }
    });

    return bookings.map((booking) => ({
      ...this.formatBooking(booking, {
        venue: venueMap.get(String(booking.venue_id)),
        user: users.get(String(booking.user_id)) || null,
      }),
      payment: paymentMap.has(String(booking._id))
        ? this.formatPayment(paymentMap.get(String(booking._id)))
        : null,
      refund: refundMap.has(String(booking._id))
        ? this.formatRefund(refundMap.get(String(booking._id)))
        : null,
    }));
  }

  async formatRefundCollection(refunds, options = {}) {
    if (refunds.length === 0) {
      return [];
    }

    const bookingIds = [...new Set(refunds.map((refund) => String(refund.booking_id)))];
    const paymentIds = [...new Set(refunds.map((refund) => String(refund.payment_id)))];
    const requesterIds = options.includeUser
      ? [...new Set(refunds.map((refund) => String(refund.requested_by)))]
      : [];
    const bookings = await Booking.find({ _id: { $in: bookingIds } });
    const venueIds = [...new Set(bookings.map((booking) => String(booking.venue_id)))];

    const [payments, venues, requesters] = await Promise.all([
      Payment.find({ _id: { $in: paymentIds } }),
      Venue.find({ _id: { $in: venueIds } }),
      options.includeUser ? this.getUserSummaries(requesterIds) : Promise.resolve(new Map()),
    ]);

    const bookingMap = new Map(bookings.map((booking) => [String(booking._id), booking]));
    const paymentMap = new Map(payments.map((payment) => [String(payment._id), payment]));
    const venueMap = new Map(venues.map((venue) => [String(venue._id), venue]));

    return refunds.map((refund) => {
      const booking = bookingMap.get(String(refund.booking_id));
      const venue = booking ? venueMap.get(String(booking.venue_id)) : null;

      return {
        ...this.formatRefund(refund),
        booking: booking ? this.formatBooking(booking, { venue }) : null,
        payment: paymentMap.has(String(refund.payment_id))
          ? this.formatPayment(paymentMap.get(String(refund.payment_id)))
          : null,
        requester: requesters.get(String(refund.requested_by)) || null,
      };
    });
  }

  async getUserSummaries(userIds) {
    if (userIds.length === 0) {
      return new Map();
    }

    const profiles = await Profile.find({ user_id: { $in: userIds } }).populate(
      "user_id",
      "email"
    );

    return new Map(
      profiles.map((profile) => [
        String(profile.user_id?._id || profile.user_id),
        {
          id: String(profile.user_id?._id || profile.user_id),
          email: profile.user_id?.email || null,
          name: profile.name,
        },
      ])
    );
  }

  async getUserSummary(userId) {
    const users = await this.getUserSummaries([String(userId)]);
    return users.get(String(userId)) || null;
  }

  assertOwnership(ownerId, userId, message) {
    if (String(ownerId) !== String(userId)) {
      throw createHttpError(HTTP_STATUS.FORBIDDEN, message);
    }
  }

  formatVenue(venue) {
    if (!venue) {
      return null;
    }

    return {
      id: String(venue._id),
      ownerId: String(venue.owner_id),
      name: venue.name,
      location: venue.location,
      description: venue.description || "",
      slotPrice: venue.slot_price,
      slotDurationMinutes: venue.slot_duration_minutes,
      weeklySchedule: venue.weekly_schedule.map((item) => ({
        dayOfWeek: item.day_of_week,
        startTime: item.start_time,
        endTime: item.end_time,
      })),
      createdAt: venue.createdAt,
      updatedAt: venue.updatedAt,
    };
  }

  formatBooking(booking, context = {}) {
    if (!booking) {
      return null;
    }

    return {
      id: String(booking._id),
      status: booking.status,
      amount: booking.amount,
      holdExpiresAt: booking.hold_expires_at,
      slot: {
        date: booking.date,
        startTime: booking.start_time,
        endTime: booking.end_time,
      },
      venue: context.venue ? this.formatVenue(context.venue) : undefined,
      user: context.user || undefined,
      createdAt: booking.createdAt,
      updatedAt: booking.updatedAt,
    };
  }

  formatPayment(payment) {
    if (!payment) {
      return null;
    }

    return {
      id: String(payment._id),
      bookingId: String(payment.booking_id),
      amount: payment.amount,
      provider: payment.provider,
      providerReference: payment.provider_reference || "",
      status: payment.status,
      paidAt: payment.paid_at,
      refundedAt: payment.refunded_at,
      createdAt: payment.createdAt,
      updatedAt: payment.updatedAt,
    };
  }

  formatRefund(refund) {
    if (!refund) {
      return null;
    }

    return {
      id: String(refund._id),
      bookingId: String(refund.booking_id),
      paymentId: String(refund.payment_id),
      requestedBy: String(refund.requested_by),
      processedBy: refund.processed_by ? String(refund.processed_by) : null,
      type: refund.type,
      status: refund.status,
      note: refund.note || "",
      processedAt: refund.processed_at,
      createdAt: refund.createdAt,
      updatedAt: refund.updatedAt,
    };
  }
}

module.exports = new VenueService();
