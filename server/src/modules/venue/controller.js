const { HTTP_STATUS } = require("../../constants");
const venueService = require("./service");
const {
  validateCreateVenuePayload,
  validateObjectIdParam,
  validateVenueListQuery,
  validateSlotsQuery,
  validateCreateHoldPayload,
  validateCreatePaymentPayload,
  validatePaymentWebhookPayload,
  validateSepayWebhookPayload,
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
  normalizeApiKey(value) {
    if (!value) {
      return "";
    }

    return String(value).replace(/^(Bearer|Apikey)\s+/i, "").trim();
  }

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
    const { isValid, errors, value } = validateVenueListQuery(req.query);

    if (!isValid) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({ errors });
    }

    try {
      const data = await venueService.listVenues(value);

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

  async handlePaymentWebhook(req, res) {
    if (req.params.provider === "sepay") {
      const expectedApiKey = this.normalizeApiKey(process.env.SEPAY_API_KEY);
      const providedApiKey = this.normalizeApiKey(req.headers.authorization);

      if (!expectedApiKey) {
        return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
          message: "SEPAY_API_KEY is not configured.",
        });
      }

      if (!providedApiKey || providedApiKey !== expectedApiKey) {
        return res.status(HTTP_STATUS.UNAUTHORIZED).json({
          message: "Invalid Sepay webhook authorization.",
        });
      }

      const payloadValidation = validateSepayWebhookPayload(req.body);

      if (!payloadValidation.isValid) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({ errors: payloadValidation.errors });
      }

      try {
        const data = await venueService.handleSepayWebhook(payloadValidation.value);

        return res.status(HTTP_STATUS.OK).json({
          message: "Sepay webhook processed successfully.",
          data,
        });
      } catch (error) {
        return res.status(error.statusCode || HTTP_STATUS.BAD_REQUEST).json({
          message: error.message,
        });
      }
    }

    const expectedApiKey = this.normalizeApiKey(process.env.PAYMENT_WEBHOOK_API_KEY);
    const providedApiKey = this.normalizeApiKey(req.headers.authorization);

    if (expectedApiKey) {
      if (!providedApiKey || providedApiKey !== expectedApiKey) {
        return res.status(HTTP_STATUS.UNAUTHORIZED).json({
          message: "Invalid payment webhook authorization.",
        });
      }
    } else if (process.env.NODE_ENV === "production") {
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        message: "Payment webhook authorization is not configured.",
      });
    }

    const payloadValidation = validatePaymentWebhookPayload(req.body);

    if (!payloadValidation.isValid) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({ errors: payloadValidation.errors });
    }

    try {
      const data = await venueService.handlePaymentWebhook(
        req.params.provider,
        payloadValidation.value
      );

      return res.status(HTTP_STATUS.OK).json({
        message: "Payment webhook processed successfully.",
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
    const payloadValidation = validatePaymentWebhookPayload({
      ...req.body,
      payment_id: req.params.paymentId,
      status: req.body?.status || "paid",
    });

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

  async getPaymentStatus(req, res) {
    const idValidation = validateObjectIdParam(req.params.paymentId, "Payment");

    if (!idValidation.isValid) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({ errors: idValidation.errors });
    }

    try {
      const data = await venueService.getPaymentStatus(req.user.id, req.params.paymentId);

      return res.status(HTTP_STATUS.OK).json({
        message: "Payment status fetched successfully.",
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
