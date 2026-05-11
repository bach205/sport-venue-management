const { HTTP_STATUS } = require("../../constants");
const venueService = require("./service");
const {
  validateCreateVenuePayload,
  validateObjectIdParam,
  validatePaginationQuery,
  validateSlotsQuery,
  validateCreateHoldPayload,
  validateCreatePaymentPayload,
  validateRefundPayload,
  validateBookingHistoryQuery,
  validateVenueUpdatePayload,
  validateSchedulePayload,
  validateAvailabilityPayload,
  validateOwnerBookingsQuery,
  validateRefundDecisionPayload,
  validateRefundRequestsQuery,
} = require("../../validations/venue.validation");

class VenueController {
  async createVenue(req, res) {
    const { isValid, errors, value } = validateCreateVenuePayload(req.body);

    if (!isValid) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({ errors });
    }

    try {
      const data = await venueService.createVenue(req.user.id, value);

      return res.status(HTTP_STATUS.CREATED).json({
        message: "Venue created successfully.",
        data,
      });
    } catch (error) {
      return res.status(error.statusCode || HTTP_STATUS.BAD_REQUEST).json({
        message: error.message,
      });
    }
  }

  async listVenues(req, res) {
    const { isValid, errors, value } = validatePaginationQuery(req.query);

    if (!isValid) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({ errors });
    }

    try {
      const data = await venueService.listVenues(value.page, value.limit);

      return res.status(HTTP_STATUS.OK).json({
        message: "Venues fetched successfully.",
        data,
      });
    } catch (error) {
      return res.status(error.statusCode || HTTP_STATUS.BAD_REQUEST).json({
        message: error.message,
      });
    }
  }

  async getVenueSlots(req, res) {
    const idValidation = validateObjectIdParam(req.params.venueId, "Venue");
    const queryValidation = validateSlotsQuery(req.query);

    if (!idValidation.isValid || !queryValidation.isValid) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        errors: [...idValidation.errors, ...queryValidation.errors],
      });
    }

    try {
      const data = await venueService.getVenueSlots(
        req.params.venueId,
        queryValidation.value.date
      );

      return res.status(HTTP_STATUS.OK).json({
        message: "Venue slots fetched successfully.",
        data,
      });
    } catch (error) {
      return res.status(error.statusCode || HTTP_STATUS.BAD_REQUEST).json({
        message: error.message,
      });
    }
  }

  async createBookingHold(req, res) {
    const { isValid, errors, value } = validateCreateHoldPayload(req.body);

    if (!isValid) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({ errors });
    }

    try {
      const data = await venueService.createBookingHold(req.user.id, value);

      return res.status(HTTP_STATUS.CREATED).json({
        message: "Booking hold created successfully.",
        data,
      });
    } catch (error) {
      return res.status(error.statusCode || HTTP_STATUS.BAD_REQUEST).json({
        message: error.message,
      });
    }
  }

  async createPayment(req, res) {
    const idValidation = validateObjectIdParam(req.params.bookingId, "Booking");
    const payloadValidation = validateCreatePaymentPayload(req.body);

    if (!idValidation.isValid || !payloadValidation.isValid) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        errors: [...idValidation.errors, ...payloadValidation.errors],
      });
    }

    try {
      const data = await venueService.createPayment(
        req.user.id,
        req.params.bookingId,
        payloadValidation.value
      );

      return res.status(HTTP_STATUS.CREATED).json({
        message: "Payment created successfully.",
        data,
      });
    } catch (error) {
      return res.status(error.statusCode || HTTP_STATUS.BAD_REQUEST).json({
        message: error.message,
      });
    }
  }

  async confirmPayment(req, res) {
    const idValidation = validateObjectIdParam(req.params.paymentId, "Payment");
    const payloadValidation = validateCreatePaymentPayload(req.body);

    if (!idValidation.isValid || !payloadValidation.isValid) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        errors: [...idValidation.errors, ...payloadValidation.errors],
      });
    }

    try {
      const data = await venueService.confirmPayment(
        req.user.id,
        req.params.paymentId,
        payloadValidation.value
      );

      return res.status(HTTP_STATUS.OK).json({
        message: "Payment confirmed successfully.",
        data,
      });
    } catch (error) {
      return res.status(error.statusCode || HTTP_STATUS.BAD_REQUEST).json({
        message: error.message,
      });
    }
  }

  async requestRefund(req, res) {
    const idValidation = validateObjectIdParam(req.params.bookingId, "Booking");
    const payloadValidation = validateRefundPayload(req.body);

    if (!idValidation.isValid || !payloadValidation.isValid) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        errors: [...idValidation.errors, ...payloadValidation.errors],
      });
    }

    try {
      const data = await venueService.requestRefund(
        req.user.id,
        req.params.bookingId,
        payloadValidation.value
      );

      return res.status(HTTP_STATUS.OK).json({
        message:
          data.mode === "auto"
            ? "Refund processed successfully."
            : "Manual refund request created successfully.",
        data,
      });
    } catch (error) {
      return res.status(error.statusCode || HTTP_STATUS.BAD_REQUEST).json({
        message: error.message,
      });
    }
  }

  async getMyBookings(req, res) {
    const { isValid, errors, value } = validateBookingHistoryQuery(req.query);

    if (!isValid) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({ errors });
    }

    try {
      const data = await venueService.getMyBookings(
        req.user.id,
        value.page,
        value.limit,
        value.status
      );

      return res.status(HTTP_STATUS.OK).json({
        message: "Booking history fetched successfully.",
        data,
      });
    } catch (error) {
      return res.status(error.statusCode || HTTP_STATUS.BAD_REQUEST).json({
        message: error.message,
      });
    }
  }

  async getMyBookingById(req, res) {
    const { isValid, errors } = validateObjectIdParam(req.params.bookingId, "Booking");

    if (!isValid) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({ errors });
    }

    try {
      const data = await venueService.getMyBookingById(req.user.id, req.params.bookingId);

      return res.status(HTTP_STATUS.OK).json({
        message: "Booking fetched successfully.",
        data,
      });
    } catch (error) {
      return res.status(error.statusCode || HTTP_STATUS.BAD_REQUEST).json({
        message: error.message,
      });
    }
  }

  async getMyVenues(req, res) {
    try {
      const data = await venueService.getMyVenues(req.user.id);

      return res.status(HTTP_STATUS.OK).json({
        message: "Owner venues fetched successfully.",
        data,
      });
    } catch (error) {
      return res.status(error.statusCode || HTTP_STATUS.BAD_REQUEST).json({
        message: error.message,
      });
    }
  }

  async updateVenue(req, res) {
    const idValidation = validateObjectIdParam(req.params.venueId, "Venue");
    const payloadValidation = validateVenueUpdatePayload(req.body);

    if (!idValidation.isValid || !payloadValidation.isValid) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        errors: [...idValidation.errors, ...payloadValidation.errors],
      });
    }

    try {
      const data = await venueService.updateVenue(
        req.user.id,
        req.params.venueId,
        payloadValidation.value
      );

      return res.status(HTTP_STATUS.OK).json({
        message: "Venue updated successfully.",
        data,
      });
    } catch (error) {
      return res.status(error.statusCode || HTTP_STATUS.BAD_REQUEST).json({
        message: error.message,
      });
    }
  }

  async deleteVenue(req, res) {
    const { isValid, errors } = validateObjectIdParam(req.params.venueId, "Venue");

    if (!isValid) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({ errors });
    }

    try {
      const data = await venueService.deleteVenue(req.user.id, req.params.venueId);

      return res.status(HTTP_STATUS.OK).json({
        message: "Venue deleted successfully.",
        data,
      });
    } catch (error) {
      return res.status(error.statusCode || HTTP_STATUS.BAD_REQUEST).json({
        message: error.message,
      });
    }
  }

  async updateVenueSchedule(req, res) {
    const idValidation = validateObjectIdParam(req.params.venueId, "Venue");
    const payloadValidation = validateSchedulePayload(req.body);

    if (!idValidation.isValid || !payloadValidation.isValid) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        errors: [...idValidation.errors, ...payloadValidation.errors],
      });
    }

    try {
      const data = await venueService.updateVenueSchedule(
        req.user.id,
        req.params.venueId,
        payloadValidation.value
      );

      return res.status(HTTP_STATUS.OK).json({
        message: "Venue schedule updated successfully.",
        data,
      });
    } catch (error) {
      return res.status(error.statusCode || HTTP_STATUS.BAD_REQUEST).json({
        message: error.message,
      });
    }
  }

  async updateAvailability(req, res) {
    const idValidation = validateObjectIdParam(req.params.venueId, "Venue");
    const payloadValidation = validateAvailabilityPayload(req.body);

    if (!idValidation.isValid || !payloadValidation.isValid) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        errors: [...idValidation.errors, ...payloadValidation.errors],
      });
    }

    try {
      const data = await venueService.updateAvailability(
        req.user.id,
        req.params.venueId,
        payloadValidation.value
      );

      return res.status(HTTP_STATUS.OK).json({
        message: "Venue availability updated successfully.",
        data,
      });
    } catch (error) {
      return res.status(error.statusCode || HTTP_STATUS.BAD_REQUEST).json({
        message: error.message,
      });
    }
  }

  async getVenueBookings(req, res) {
    const idValidation = validateObjectIdParam(req.params.venueId, "Venue");
    const queryValidation = validateOwnerBookingsQuery(req.query);

    if (!idValidation.isValid || !queryValidation.isValid) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        errors: [...idValidation.errors, ...queryValidation.errors],
      });
    }

    try {
      const data = await venueService.getVenueBookings(
        req.user.id,
        req.params.venueId,
        queryValidation.value
      );

      return res.status(HTTP_STATUS.OK).json({
        message: "Venue bookings fetched successfully.",
        data,
      });
    } catch (error) {
      return res.status(error.statusCode || HTTP_STATUS.BAD_REQUEST).json({
        message: error.message,
      });
    }
  }

  async getVenueRefundRequests(req, res) {
    const idValidation = validateObjectIdParam(req.params.venueId, "Venue");
    const queryValidation = validateRefundRequestsQuery(req.query);

    if (!idValidation.isValid || !queryValidation.isValid) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        errors: [...idValidation.errors, ...queryValidation.errors],
      });
    }

    try {
      const data = await venueService.getVenueRefundRequests(
        req.user.id,
        req.params.venueId,
        queryValidation.value
      );

      return res.status(HTTP_STATUS.OK).json({
        message: "Venue refund requests fetched successfully.",
        data,
      });
    } catch (error) {
      return res.status(error.statusCode || HTTP_STATUS.BAD_REQUEST).json({
        message: error.message,
      });
    }
  }

  async resolveManualRefund(req, res) {
    const idValidation = validateObjectIdParam(req.params.refundId, "Refund");
    const payloadValidation = validateRefundDecisionPayload(req.body);

    if (!idValidation.isValid || !payloadValidation.isValid) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        errors: [...idValidation.errors, ...payloadValidation.errors],
      });
    }

    try {
      const data = await venueService.resolveManualRefund(
        req.user.id,
        req.params.refundId,
        payloadValidation.value
      );

      return res.status(HTTP_STATUS.OK).json({
        message: "Refund request processed successfully.",
        data,
      });
    } catch (error) {
      return res.status(error.statusCode || HTTP_STATUS.BAD_REQUEST).json({
        message: error.message,
      });
    }
  }
}

module.exports = new VenueController();
