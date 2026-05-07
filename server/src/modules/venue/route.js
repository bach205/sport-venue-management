const express = require("express");
const asyncHandler = require("../../utils/asyncHandler");
const authMiddleware = require("../../middlewares/auth.middleware");
const requireRole = require("../../middlewares/requireRole.middleware");
const venueController = require("./controller");

const router = express.Router();

router.get("/venues", asyncHandler((req, res) => venueController.listVenues(req, res)));
router.get(
  "/venues/:venueId/slots",
  asyncHandler((req, res) => venueController.getVenueSlots(req, res))
);

router.post(
  "/bookings/holds",
  authMiddleware,
  asyncHandler((req, res) => venueController.createBookingHold(req, res))
);
router.post(
  "/bookings/:bookingId/payments",
  authMiddleware,
  asyncHandler((req, res) => venueController.createPayment(req, res))
);
router.post(
  "/payments/:paymentId/confirm",
  authMiddleware,
  asyncHandler((req, res) => venueController.confirmPayment(req, res))
);
router.post(
  "/bookings/:bookingId/refund",
  authMiddleware,
  asyncHandler((req, res) => venueController.requestRefund(req, res))
);
router.get(
  "/bookings/me",
  authMiddleware,
  asyncHandler((req, res) => venueController.getMyBookings(req, res))
);
router.get(
  "/bookings/me/:bookingId",
  authMiddleware,
  asyncHandler((req, res) => venueController.getMyBookingById(req, res))
);

router.get(
  "/my-venues",
  authMiddleware,
  requireRole("owner"),
  asyncHandler((req, res) => venueController.getMyVenues(req, res))
);
router.patch(
  "/my-venues/:venueId",
  authMiddleware,
  requireRole("owner"),
  asyncHandler((req, res) => venueController.updateVenue(req, res))
);
router.put(
  "/my-venues/:venueId/schedule",
  authMiddleware,
  requireRole("owner"),
  asyncHandler((req, res) => venueController.updateVenueSchedule(req, res))
);
router.put(
  "/my-venues/:venueId/availability",
  authMiddleware,
  requireRole("owner"),
  asyncHandler((req, res) => venueController.updateAvailability(req, res))
);
router.get(
  "/my-venues/:venueId/bookings",
  authMiddleware,
  requireRole("owner"),
  asyncHandler((req, res) => venueController.getVenueBookings(req, res))
);
router.get(
  "/my-venues/:venueId/refund-requests",
  authMiddleware,
  requireRole("owner"),
  asyncHandler((req, res) => venueController.getVenueRefundRequests(req, res))
);
router.patch(
  "/my-venues/refund-requests/:refundId",
  authMiddleware,
  requireRole("owner"),
  asyncHandler((req, res) => venueController.resolveManualRefund(req, res))
);

module.exports = router;
