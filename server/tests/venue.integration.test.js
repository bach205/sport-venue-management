const mongoose = require("mongoose");
const request = require("supertest");
const { MongoMemoryServer } = require("mongodb-memory-server");

const app = require("../app");
const { signToken } = require("../src/utils/jwt");
const { User, Profile, UserRole } = require("../src/modules/user/model");
const {
  Venue,
  VenueAvailabilityOverride,
  Booking,
  BookingItem,
  Payment,
  Refund,
} = require("../src/modules/venue/model");

const TEST_DATE = "2026-05-11";
const TEST_DAY_OF_WEEK = new Date(`${TEST_DATE}T00:00:00`).getDay();

let mongoServer;

const authHeader = (token) => ({ Authorization: `Bearer ${token}` });

const createUser = async (role, email) => {
  const user = await User.create({
    email,
    password_hash: "password123",
    is_verified: true,
  });

  await Profile.create({
    user_id: user._id,
    name: email.split("@")[0],
  });

  await UserRole.create({
    user_id: user._id,
    role,
  });

  return {
    user,
    token: signToken({ id: user._id, email: user.email }),
  };
};

const createVenue = async (ownerId) =>
  Venue.create({
    owner_id: ownerId,
    name: "Central Court",
    location: "District 1",
    description: "Indoor court",
    slot_price: 250000,
    slot_duration_minutes: 60,
    weekly_schedule: [
      { day_of_week: TEST_DAY_OF_WEEK, start_time: "08:00", end_time: "12:00" },
    ],
  });

const createHold = async (token, venueId, startTime, endTime) =>
  request(app)
    .post("/api/v1/bookings/holds")
    .set(authHeader(token))
    .send({
      venue_id: String(venueId),
      date: TEST_DATE,
      start_time: startTime,
      end_time: endTime,
    });

const createPayment = async (token, bookingId, payload = {}) =>
  request(app)
    .post(`/api/v1/bookings/${bookingId}/payments`)
    .set(authHeader(token))
    .send(payload);

const sendPaymentWebhook = async (provider, payload) =>
  request(app)
    .post(`/api/v1/webhooks/payments/${provider}`)
    .send(payload);

const confirmPayment = async (token, paymentId, payload = {}) =>
  request(app)
    .post(`/api/v1/payments/${paymentId}/confirm`)
    .set(authHeader(token))
    .send(payload);

const createConfirmedBooking = async (token, venueId, startTime, endTime, paidAt) => {
  const holdResponse = await createHold(token, venueId, startTime, endTime);
  const bookingId = holdResponse.body.data.booking.id;

  const paymentResponse = await createPayment(token, bookingId);
  const paymentId = paymentResponse.body.data.payment.id;
  const provider = paymentResponse.body.data.payment.provider;

  await sendPaymentWebhook(provider, {
    payment_id: paymentId,
    status: "paid",
    paid_at: paidAt ? paidAt.toISOString() : undefined,
  });

  if (paidAt) {
    await Payment.findByIdAndUpdate(paymentId, { paid_at: paidAt });
  }

  return {
    bookingId,
    paymentId,
  };
};

beforeAll(async () => {
  process.env.JWT_SECRET = "test_secret";
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
  await Booking.syncIndexes();
  await BookingItem.syncIndexes();
  await VenueAvailabilityOverride.syncIndexes();
});

afterEach(async () => {
  const collections = mongoose.connection.collections;
  await Promise.all(Object.values(collections).map((collection) => collection.deleteMany({})));
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe("Venue booking module", () => {
  test("lets an owner create a venue", async () => {
    const owner = await createUser("owner", "owner-create@example.com");

    const response = await request(app)
      .post("/api/v1/my-venues")
      .set(authHeader(owner.token))
      .send({
        name: "Fresh Arena",
        location: "Thu Duc",
        description: "Newly opened venue",
        slot_price: 300000,
        slot_duration_minutes: 90,
        weekly_schedule: [
          {
            day_of_week: TEST_DAY_OF_WEEK,
            start_time: "07:00",
            end_time: "10:00",
          },
        ],
      });

    expect(response.status).toBe(201);
    expect(response.body.data.name).toBe("Fresh Arena");
    expect(response.body.data.slotPrice).toBe(300000);
    expect(response.body.data.slotDurationMinutes).toBe(90);
  });

  test("returns slot statuses for available and unavailable schedule entries", async () => {
    const owner = await createUser("owner", "owner1@example.com");
    const venue = await createVenue(owner.user._id);

    await VenueAvailabilityOverride.create({
      venue_id: venue._id,
      date: TEST_DATE,
      start_time: "09:00",
      end_time: "10:00",
      status: "unavailable",
      created_by: owner.user._id,
      reason: "maintenance",
    });

    const response = await request(app).get(
      `/api/v1/venues/${venue._id}/slots?date=${TEST_DATE}`
    );

    expect(response.status).toBe(200);
    expect(response.body.data.slots).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ startTime: "08:00", endTime: "09:00", status: "available" }),
        expect.objectContaining({ startTime: "09:00", endTime: "10:00", status: "unavailable" }),
      ])
    );
  });

  test("returns availability summary counts when listing venues by date", async () => {
    const owner = await createUser("owner", "owner-summary@example.com");
    const user = await createUser("user", "summary-user@example.com");
    const venue = await createVenue(owner.user._id);

    await VenueAvailabilityOverride.create({
      venue_id: venue._id,
      date: TEST_DATE,
      start_time: "11:00",
      end_time: "12:00",
      status: "unavailable",
      created_by: owner.user._id,
      reason: "maintenance",
    });

    await createHold(user.token, venue._id, "08:00", "09:00");

    const paymentPendingHold = await createHold(user.token, venue._id, "09:00", "10:00");
    const pendingBookingId = paymentPendingHold.body.data.booking.id;
    await createPayment(user.token, pendingBookingId);

    const response = await request(app).get(`/api/v1/venues?date=${TEST_DATE}`);

    expect(response.status).toBe(200);
    expect(response.body.data.items[0].availabilitySummary).toEqual({
      date: TEST_DATE,
      totalSlots: 4,
      availableSlots: 1,
      heldSlots: 1,
      bookedSlots: 1,
      unavailableSlots: 1,
    });
  });

  test("creates a hold for an available slot and rejects duplicate holds", async () => {
    const owner = await createUser("owner", "owner2@example.com");
    const userA = await createUser("user", "userA@example.com");
    const userB = await createUser("user", "userB@example.com");
    const venue = await createVenue(owner.user._id);

    const firstResponse = await createHold(userA.token, venue._id, "08:00", "09:00");
    const secondResponse = await createHold(userB.token, venue._id, "08:00", "09:00");

    expect(firstResponse.status).toBe(201);
    expect(firstResponse.body.data.booking.status).toBe("hold");
    expect(secondResponse.status).toBe(400);
    expect(secondResponse.body.message).toContain("no longer available");
  });

  test("prevents double booking under concurrent hold requests", async () => {
    const owner = await createUser("owner", "owner3@example.com");
    const userA = await createUser("user", "concurrentA@example.com");
    const userB = await createUser("user", "concurrentB@example.com");
    const venue = await createVenue(owner.user._id);

    const [responseA, responseB] = await Promise.all([
      createHold(userA.token, venue._id, "10:00", "11:00"),
      createHold(userB.token, venue._id, "10:00", "11:00"),
    ]);

    const statuses = [responseA.status, responseB.status].sort((a, b) => a - b);
    expect(statuses).toEqual([201, 400]);
  });

  test("creates one booking with multiple booking items for a contiguous time range", async () => {
    const owner = await createUser("owner", "owner-multi@example.com");
    const user = await createUser("user", "multi-user@example.com");
    const venue = await createVenue(owner.user._id);

    const holdResponse = await createHold(user.token, venue._id, "08:00", "10:00");

    expect(holdResponse.status).toBe(201);
    expect(holdResponse.body.data.booking.status).toBe("hold");
    expect(holdResponse.body.data.booking.slot.startTime).toBe("08:00");
    expect(holdResponse.body.data.booking.slot.endTime).toBe("10:00");
    expect(holdResponse.body.data.booking.slotCount).toBe(2);
    expect(holdResponse.body.data.booking.amount).toBe(500000);
    expect(holdResponse.body.data.booking.slots).toEqual([
      { date: TEST_DATE, startTime: "08:00", endTime: "09:00" },
      { date: TEST_DATE, startTime: "09:00", endTime: "10:00" },
    ]);

    const bookingId = holdResponse.body.data.booking.id;
    expect(await BookingItem.countDocuments({ booking_id: bookingId })).toBe(2);

    const paymentResponse = await createPayment(user.token, bookingId);
    expect(paymentResponse.status).toBe(201);
    expect(paymentResponse.body.data.payment.amount).toBe(500000);

    const slotsResponse = await request(app).get(
      `/api/v1/venues/${venue._id}/slots?date=${TEST_DATE}`
    );

    expect(slotsResponse.status).toBe(200);
    expect(slotsResponse.body.data.slots).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ startTime: "08:00", endTime: "09:00", status: "booked" }),
        expect.objectContaining({ startTime: "09:00", endTime: "10:00", status: "booked" }),
      ])
    );
  });

  test("confirms payment through webhook and updates booking state", async () => {
    const owner = await createUser("owner", "owner4@example.com");
    const user = await createUser("user", "payer@example.com");
    const venue = await createVenue(owner.user._id);

    const holdResponse = await createHold(user.token, venue._id, "08:00", "09:00");
    const bookingId = holdResponse.body.data.booking.id;
    const paymentResponse = await createPayment(user.token, bookingId);

    expect(paymentResponse.status).toBe(201);
    expect(paymentResponse.body.data.booking.status).toBe("payment_pending");
    expect(paymentResponse.body.data.payment.status).toBe("pending");

    const paymentId = paymentResponse.body.data.payment.id;
    const provider = paymentResponse.body.data.payment.provider;
    const webhookResponse = await sendPaymentWebhook(provider, {
      payment_id: paymentId,
      provider_reference: `provider-${paymentId}`,
      status: "paid",
    });

    expect(webhookResponse.status).toBe(200);
    expect(webhookResponse.body.data.booking.status).toBe("confirmed");
    expect(webhookResponse.body.data.payment.status).toBe("paid");
    expect(webhookResponse.body.data.payment.providerReference).toBe(`provider-${paymentId}`);
  });

  test("keeps compatibility confirm endpoint routed through shared settlement logic", async () => {
    const owner = await createUser("owner", "owner-compat@example.com");
    const user = await createUser("user", "compat-user@example.com");
    const venue = await createVenue(owner.user._id);

    const holdResponse = await createHold(user.token, venue._id, "10:00", "11:00");
    const bookingId = holdResponse.body.data.booking.id;
    const paymentResponse = await createPayment(user.token, bookingId);
    const paymentId = paymentResponse.body.data.payment.id;

    const response = await confirmPayment(user.token, paymentId, {
      status: "paid",
      provider_reference: `compat-${paymentId}`,
    });

    expect(response.status).toBe(200);
    expect(response.body.data.booking.status).toBe("confirmed");
    expect(response.body.data.payment.status).toBe("paid");
  });

  test("fails payment through webhook and reopens the slot", async () => {
    const owner = await createUser("owner", "owner-failed@example.com");
    const user = await createUser("user", "failed-user@example.com");
    const venue = await createVenue(owner.user._id);

    const holdResponse = await createHold(user.token, venue._id, "08:00", "09:00");
    const bookingId = holdResponse.body.data.booking.id;
    const paymentResponse = await createPayment(user.token, bookingId);
    const paymentId = paymentResponse.body.data.payment.id;
    const provider = paymentResponse.body.data.payment.provider;

    const webhookResponse = await sendPaymentWebhook(provider, {
      payment_id: paymentId,
      status: "failed",
    });

    expect(webhookResponse.status).toBe(200);
    expect(webhookResponse.body.data.booking.status).toBe("expired");
    expect(webhookResponse.body.data.payment.status).toBe("failed");

    const slotsResponse = await request(app).get(
      `/api/v1/venues/${venue._id}/slots?date=${TEST_DATE}`
    );

    expect(slotsResponse.body.data.slots).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ startTime: "08:00", endTime: "09:00", status: "available" }),
      ])
    );
  });

  test("handles duplicate webhook callbacks idempotently", async () => {
    const owner = await createUser("owner", "owner-duplicate@example.com");
    const user = await createUser("user", "duplicate-user@example.com");
    const venue = await createVenue(owner.user._id);

    const holdResponse = await createHold(user.token, venue._id, "09:00", "10:00");
    const bookingId = holdResponse.body.data.booking.id;
    const paymentResponse = await createPayment(user.token, bookingId);
    const paymentId = paymentResponse.body.data.payment.id;
    const provider = paymentResponse.body.data.payment.provider;

    const payload = {
      payment_id: paymentId,
      provider_reference: `dup-${paymentId}`,
      status: "paid",
    };

    const firstResponse = await sendPaymentWebhook(provider, payload);
    const secondResponse = await sendPaymentWebhook(provider, payload);

    expect(firstResponse.status).toBe(200);
    expect(secondResponse.status).toBe(200);
    expect(secondResponse.body.data.booking.status).toBe("confirmed");
    expect(secondResponse.body.data.payment.status).toBe("paid");
  });

  test("does not reconfirm an expired hold when webhook arrives late", async () => {
    const owner = await createUser("owner", "owner-late@example.com");
    const user = await createUser("user", "late-user@example.com");
    const venue = await createVenue(owner.user._id);

    const holdResponse = await createHold(user.token, venue._id, "10:00", "11:00");
    const bookingId = holdResponse.body.data.booking.id;
    const paymentResponse = await createPayment(user.token, bookingId);
    const paymentId = paymentResponse.body.data.payment.id;
    const provider = paymentResponse.body.data.payment.provider;

    await Booking.findByIdAndUpdate(bookingId, {
      hold_expires_at: new Date(Date.now() - 60 * 1000),
    });

    const webhookResponse = await sendPaymentWebhook(provider, {
      payment_id: paymentId,
      status: "paid",
    });

    expect(webhookResponse.status).toBe(200);
    expect(webhookResponse.body.data.booking.status).toBe("expired");
    expect(webhookResponse.body.data.payment.status).toBe("failed");
  });

  test("expires stale holds and reopens the slot in availability responses", async () => {
    const owner = await createUser("owner", "owner5@example.com");
    const user = await createUser("user", "stale@example.com");
    const venue = await createVenue(owner.user._id);

    const holdResponse = await createHold(user.token, venue._id, "08:00", "09:00");
    const bookingId = holdResponse.body.data.booking.id;

    await Booking.findByIdAndUpdate(bookingId, {
      hold_expires_at: new Date(Date.now() - 60 * 1000),
    });

    const slotsResponse = await request(app).get(
      `/api/v1/venues/${venue._id}/slots?date=${TEST_DATE}`
    );
    const booking = await Booking.findById(bookingId);

    expect(slotsResponse.status).toBe(200);
    expect(booking.status).toBe("expired");
    expect(slotsResponse.body.data.slots).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ startTime: "08:00", endTime: "09:00", status: "available" }),
      ])
    );
  });

  test("shows payment-pending slots as booked", async () => {
    const owner = await createUser("owner", "owner-pending@example.com");
    const user = await createUser("user", "pending-user@example.com");
    const venue = await createVenue(owner.user._id);

    const holdResponse = await createHold(user.token, venue._id, "09:00", "10:00");
    const bookingId = holdResponse.body.data.booking.id;
    await createPayment(user.token, bookingId);

    const slotsResponse = await request(app).get(
      `/api/v1/venues/${venue._id}/slots?date=${TEST_DATE}`
    );

    expect(slotsResponse.status).toBe(200);
    expect(slotsResponse.body.data.slots).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ startTime: "09:00", endTime: "10:00", status: "booked" }),
      ])
    );
  });

  test("processes refunds automatically within five minutes and reopens the slot", async () => {
    const owner = await createUser("owner", "owner6@example.com");
    const user = await createUser("user", "refund-auto@example.com");
    const venue = await createVenue(owner.user._id);

    const { bookingId } = await createConfirmedBooking(
      user.token,
      venue._id,
      "08:00",
      "09:00",
      new Date()
    );

    const refundResponse = await request(app)
      .post(`/api/v1/bookings/${bookingId}/refund`)
      .set(authHeader(user.token))
      .send({ note: "Need to cancel" });

    expect(refundResponse.status).toBe(200);
    expect(refundResponse.body.data.mode).toBe("auto");
    expect(refundResponse.body.data.booking.status).toBe("refunded");
    expect(refundResponse.body.data.payment.status).toBe("refunded");
    expect(refundResponse.body.data.refund.status).toBe("completed");

    const slotsResponse = await request(app).get(
      `/api/v1/venues/${venue._id}/slots?date=${TEST_DATE}`
    );

    expect(slotsResponse.body.data.slots).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ startTime: "08:00", endTime: "09:00", status: "available" }),
      ])
    );
  });

  test("creates a manual refund request after five minutes and keeps the slot booked until owner acts", async () => {
    const owner = await createUser("owner", "owner7@example.com");
    const user = await createUser("user", "refund-manual@example.com");
    const venue = await createVenue(owner.user._id);

    const { bookingId } = await createConfirmedBooking(
      user.token,
      venue._id,
      "09:00",
      "10:00",
      new Date(Date.now() - (6 * 60 * 1000))
    );

    const refundResponse = await request(app)
      .post(`/api/v1/bookings/${bookingId}/refund`)
      .set(authHeader(user.token))
      .send({ note: "Late cancel" });

    expect(refundResponse.status).toBe(200);
    expect(refundResponse.body.data.mode).toBe("manual");
    expect(refundResponse.body.data.refund.status).toBe("pending_manual");
    expect(refundResponse.body.data.booking.status).toBe("confirmed");

    const slotsResponse = await request(app).get(
      `/api/v1/venues/${venue._id}/slots?date=${TEST_DATE}`
    );

    expect(slotsResponse.body.data.slots).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ startTime: "09:00", endTime: "10:00", status: "booked" }),
      ])
    );
  });

  test("lets the owner approve or reject manual refund requests and updates booking state correctly", async () => {
    const owner = await createUser("owner", "owner8@example.com");
    const userA = await createUser("user", "manual-a@example.com");
    const userB = await createUser("user", "manual-b@example.com");
    const venue = await createVenue(owner.user._id);

    const firstBooking = await createConfirmedBooking(
      userA.token,
      venue._id,
      "09:00",
      "10:00",
      new Date(Date.now() - (6 * 60 * 1000))
    );
    await request(app)
      .post(`/api/v1/bookings/${firstBooking.bookingId}/refund`)
      .set(authHeader(userA.token))
      .send({ note: "manual approve" });

    const refundListResponse = await request(app)
      .get(`/api/v1/my-venues/${venue._id}/refund-requests`)
      .set(authHeader(owner.token));

    expect(refundListResponse.status).toBe(200);
    expect(refundListResponse.body.data.items).toHaveLength(1);

    const firstRefundId = refundListResponse.body.data.items[0].id;
    const approveResponse = await request(app)
      .patch(`/api/v1/my-venues/refund-requests/${firstRefundId}`)
      .set(authHeader(owner.token))
      .send({ action: "approve", note: "approved by owner" });

    expect(approveResponse.status).toBe(200);
    expect(approveResponse.body.data.booking.status).toBe("refunded");
    expect(approveResponse.body.data.payment.status).toBe("refunded");
    expect(approveResponse.body.data.refund.status).toBe("completed");

    const secondBooking = await createConfirmedBooking(
      userB.token,
      venue._id,
      "10:00",
      "11:00",
      new Date(Date.now() - (6 * 60 * 1000))
    );
    await request(app)
      .post(`/api/v1/bookings/${secondBooking.bookingId}/refund`)
      .set(authHeader(userB.token))
      .send({ note: "manual reject" });

    const refundListResponse2 = await request(app)
      .get(`/api/v1/my-venues/${venue._id}/refund-requests?status=pending_manual`)
      .set(authHeader(owner.token));

    expect(refundListResponse2.status).toBe(200);
    expect(refundListResponse2.body.data.items).toHaveLength(1);

    const secondRefundId = refundListResponse2.body.data.items[0].id;
    const rejectResponse = await request(app)
      .patch(`/api/v1/my-venues/refund-requests/${secondRefundId}`)
      .set(authHeader(owner.token))
      .send({ action: "reject", note: "slot was already prepared" });

    expect(rejectResponse.status).toBe(200);
    expect(rejectResponse.body.data.booking.status).toBe("confirmed");
    expect(rejectResponse.body.data.refund.status).toBe("rejected");

    const ownerBookingsResponse = await request(app)
      .get(`/api/v1/my-venues/${venue._id}/bookings?date=${TEST_DATE}`)
      .set(authHeader(owner.token));

    expect(ownerBookingsResponse.status).toBe(200);
    expect(ownerBookingsResponse.body.data.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ status: "refunded" }),
        expect.objectContaining({ status: "confirmed" }),
      ])
    );
  });

  test("owner availability toggles immediately affect slot browsing results", async () => {
    const owner = await createUser("owner", "owner9@example.com");
    const venue = await createVenue(owner.user._id);

    const makeUnavailableResponse = await request(app)
      .put(`/api/v1/my-venues/${venue._id}/availability`)
      .set(authHeader(owner.token))
      .send({
        date: TEST_DATE,
        start_time: "11:00",
        end_time: "12:00",
        status: "unavailable",
        reason: "outside system booking",
      });

    expect(makeUnavailableResponse.status).toBe(200);
    expect(makeUnavailableResponse.body.data.slot.status).toBe("unavailable");

    const slotsAfterUnavailable = await request(app).get(
      `/api/v1/venues/${venue._id}/slots?date=${TEST_DATE}`
    );
    expect(slotsAfterUnavailable.body.data.slots).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ startTime: "11:00", endTime: "12:00", status: "unavailable" }),
      ])
    );

    const makeAvailableResponse = await request(app)
      .put(`/api/v1/my-venues/${venue._id}/availability`)
      .set(authHeader(owner.token))
      .send({
        date: TEST_DATE,
        start_time: "11:00",
        end_time: "12:00",
        status: "available",
      });

    expect(makeAvailableResponse.status).toBe(200);
    expect(makeAvailableResponse.body.data.slot.status).toBe("available");
  });

  test("lets an owner delete a venue with no booking history and blocks deletion otherwise", async () => {
    const owner = await createUser("owner", "owner-delete@example.com");
    const user = await createUser("user", "delete-booking@example.com");
    const deletableVenue = await createVenue(owner.user._id);

    const deleteResponse = await request(app)
      .delete(`/api/v1/my-venues/${deletableVenue._id}`)
      .set(authHeader(owner.token));

    expect(deleteResponse.status).toBe(200);
    expect(deleteResponse.body.data.id).toBe(String(deletableVenue._id));
    expect(await Venue.findById(deletableVenue._id)).toBeNull();

    const blockedVenue = await createVenue(owner.user._id);
    await createHold(user.token, blockedVenue._id, "08:00", "09:00");

    const blockedDeleteResponse = await request(app)
      .delete(`/api/v1/my-venues/${blockedVenue._id}`)
      .set(authHeader(owner.token));

    expect(blockedDeleteResponse.status).toBe(400);
    expect(blockedDeleteResponse.body.message).toContain("booking history");
  });
});
