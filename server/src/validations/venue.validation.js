const mongoose = require("mongoose");

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;
const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const normalizeOptionalString = (value) =>
  value === undefined || value === null ? undefined : String(value).trim();

const isPositiveInteger = (value) => Number.isInteger(value) && value > 0;

const validateObjectIdParam = (value, fieldLabel = "Resource") => {
  const errors = [];

  if (!value) {
    errors.push(`${fieldLabel} id is required.`);
  } else if (!mongoose.Types.ObjectId.isValid(value)) {
    errors.push(`${fieldLabel} id is invalid.`);
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

const validatePaginationQuery = (query = {}) => {
  const errors = [];
  const page = query.page === undefined ? DEFAULT_PAGE : Number(query.page);
  const limit = query.limit === undefined ? DEFAULT_LIMIT : Number(query.limit);

  if (!isPositiveInteger(page)) {
    errors.push("Page must be a positive integer.");
  }

  if (!isPositiveInteger(limit)) {
    errors.push("Limit must be a positive integer.");
  }

  if (Number.isInteger(limit) && limit > MAX_LIMIT) {
    errors.push(`Limit must not exceed ${MAX_LIMIT}.`);
  }

  return {
    isValid: errors.length === 0,
    errors,
    value: {
      page: isPositiveInteger(page) ? page : DEFAULT_PAGE,
      limit: isPositiveInteger(limit) && limit <= MAX_LIMIT ? limit : DEFAULT_LIMIT,
    },
  };
};

const validateDate = (value, fieldLabel, errors) => {
  if (!value) {
    errors.push(`${fieldLabel} is required.`);
    return;
  }

  if (!DATE_PATTERN.test(String(value))) {
    errors.push(`${fieldLabel} must be in YYYY-MM-DD format.`);
  }
};

const validateTime = (value, fieldLabel, errors) => {
  if (!value) {
    errors.push(`${fieldLabel} is required.`);
    return;
  }

  if (!TIME_PATTERN.test(String(value))) {
    errors.push(`${fieldLabel} must be in HH:mm format.`);
  }
};

const validateTimeRange = (startTime, endTime, errors, startLabel = "Start time", endLabel = "End time") => {
  validateTime(startTime, startLabel, errors);
  validateTime(endTime, endLabel, errors);

  if (
    TIME_PATTERN.test(String(startTime || "")) &&
    TIME_PATTERN.test(String(endTime || "")) &&
    String(startTime) >= String(endTime)
  ) {
    errors.push(`${endLabel} must be later than ${startLabel.toLowerCase()}.`);
  }
};

const validateSlotsQuery = (query = {}) => {
  const errors = [];

  validateDate(query.date, "Date", errors);

  return {
    isValid: errors.length === 0,
    errors,
    value: {
      date: String(query.date || ""),
    },
  };
};

const validateCreateHoldPayload = (payload = {}) => {
  const errors = [];

  if (!payload.venue_id) {
    errors.push("Venue id is required.");
  } else if (!mongoose.Types.ObjectId.isValid(payload.venue_id)) {
    errors.push("Venue id is invalid.");
  }

  validateDate(payload.date, "Date", errors);
  validateTimeRange(payload.start_time, payload.end_time, errors);

  return {
    isValid: errors.length === 0,
    errors,
    value: {
      venue_id: payload.venue_id,
      date: String(payload.date || ""),
      start_time: String(payload.start_time || ""),
      end_time: String(payload.end_time || ""),
    },
  };
};

const validateCreatePaymentPayload = (payload = {}) => {
  const provider = normalizeOptionalString(payload.provider) || "stub";
  const providerReference = normalizeOptionalString(payload.provider_reference) || "";
  const errors = [];

  if (provider.length > 50) {
    errors.push("Provider must not exceed 50 characters.");
  }

  if (providerReference.length > 120) {
    errors.push("Provider reference must not exceed 120 characters.");
  }

  return {
    isValid: errors.length === 0,
    errors,
    value: {
      provider,
      provider_reference: providerReference,
    },
  };
};

const validateRefundPayload = (payload = {}) => {
  const note = normalizeOptionalString(payload.note) || "";
  const errors = [];

  if (note.length > 500) {
    errors.push("Note must not exceed 500 characters.");
  }

  return {
    isValid: errors.length === 0,
    errors,
    value: {
      note,
    },
  };
};

const validateBookingHistoryQuery = (query = {}) => {
  const pagination = validatePaginationQuery(query);
  const errors = [...pagination.errors];
  const allowedStatuses = [
    "hold",
    "payment_pending",
    "confirmed",
    "refund_processing",
    "refunded",
    "refund_rejected",
    "expired",
  ];
  const status = normalizeOptionalString(query.status);

  if (status && !allowedStatuses.includes(status)) {
    errors.push("Status filter is invalid.");
  }

  return {
    isValid: errors.length === 0,
    errors,
    value: {
      ...pagination.value,
      status: status || undefined,
    },
  };
};

const validateVenueUpdatePayload = (payload = {}) => {
  const errors = [];
  const value = {};

  if (payload.name !== undefined) {
    const name = String(payload.name).trim();
    if (!name) {
      errors.push("Name is required.");
    } else {
      value.name = name;
    }
  }

  if (payload.location !== undefined) {
    const location = String(payload.location).trim();
    if (!location) {
      errors.push("Location is required.");
    } else {
      value.location = location;
    }
  }

  if (payload.description !== undefined) {
    value.description = String(payload.description).trim();
  }

  if (Object.keys(value).length === 0) {
    errors.push("At least one field is required.");
  }

  return {
    isValid: errors.length === 0,
    errors,
    value,
  };
};

const validateWeeklySchedule = (schedule, errors) => {
  if (!Array.isArray(schedule)) {
    errors.push("Weekly schedule must be an array.");
    return [];
  }

  const normalized = [];
  const seen = new Map();

  schedule.forEach((entry, index) => {
    const day = Number(entry?.day_of_week);
    const start = String(entry?.start_time || "");
    const end = String(entry?.end_time || "");

    if (!Number.isInteger(day) || day < 0 || day > 6) {
      errors.push(`Weekly schedule item ${index + 1} has an invalid day_of_week.`);
    }

    validateTimeRange(start, end, errors, "Start time", "End time");

    if (
      Number.isInteger(day) &&
      day >= 0 &&
      day <= 6 &&
      TIME_PATTERN.test(start) &&
      TIME_PATTERN.test(end) &&
      start < end
    ) {
      const current = seen.get(day) || [];

      if (current.some((range) => !(end <= range.start || start >= range.end))) {
        errors.push(`Weekly schedule item ${index + 1} overlaps another range on the same day.`);
      }

      current.push({ start, end });
      seen.set(day, current);
      normalized.push({
        day_of_week: day,
        start_time: start,
        end_time: end,
      });
    }
  });

  normalized.sort((a, b) => {
    if (a.day_of_week !== b.day_of_week) {
      return a.day_of_week - b.day_of_week;
    }

    return a.start_time.localeCompare(b.start_time);
  });

  return normalized;
};

const validateSchedulePayload = (payload = {}) => {
  const errors = [];
  const slotPrice = Number(payload.slot_price);
  const slotDuration = Number(payload.slot_duration_minutes);

  const weeklySchedule = validateWeeklySchedule(payload.weekly_schedule, errors);

  if (!Number.isFinite(slotPrice) || slotPrice < 0) {
    errors.push("Slot price must be a non-negative number.");
  }

  if (!Number.isInteger(slotDuration) || slotDuration < 15) {
    errors.push("Slot duration minutes must be an integer greater than or equal to 15.");
  }

  return {
    isValid: errors.length === 0,
    errors,
    value: {
      weekly_schedule: weeklySchedule,
      slot_price: Number.isFinite(slotPrice) ? slotPrice : undefined,
      slot_duration_minutes: Number.isInteger(slotDuration) ? slotDuration : undefined,
    },
  };
};

const validateAvailabilityPayload = (payload = {}) => {
  const errors = [];
  const status = normalizeOptionalString(payload.status);
  const reason = normalizeOptionalString(payload.reason) || "";

  validateDate(payload.date, "Date", errors);
  validateTimeRange(payload.start_time, payload.end_time, errors);

  if (!status) {
    errors.push("Status is required.");
  } else if (!["available", "unavailable"].includes(status)) {
    errors.push("Status must be either available or unavailable.");
  }

  if (reason.length > 500) {
    errors.push("Reason must not exceed 500 characters.");
  }

  return {
    isValid: errors.length === 0,
    errors,
    value: {
      date: String(payload.date || ""),
      start_time: String(payload.start_time || ""),
      end_time: String(payload.end_time || ""),
      status,
      reason,
    },
  };
};

const validateOwnerBookingsQuery = (query = {}) => {
  const pagination = validatePaginationQuery(query);
  const errors = [...pagination.errors];
  const status = normalizeOptionalString(query.status);

  if (query.date !== undefined) {
    validateDate(query.date, "Date", errors);
  }

  if (status) {
    const allowedStatuses = [
      "hold",
      "payment_pending",
      "confirmed",
      "refund_processing",
      "refunded",
      "refund_rejected",
      "expired",
    ];

    if (!allowedStatuses.includes(status)) {
      errors.push("Status filter is invalid.");
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    value: {
      ...pagination.value,
      date: query.date ? String(query.date) : undefined,
      status: status || undefined,
    },
  };
};

const validateRefundDecisionPayload = (payload = {}) => {
  const action = normalizeOptionalString(payload.action);
  const note = normalizeOptionalString(payload.note) || "";
  const errors = [];

  if (!action) {
    errors.push("Action is required.");
  } else if (!["approve", "reject"].includes(action)) {
    errors.push("Action must be either approve or reject.");
  }

  if (note.length > 500) {
    errors.push("Note must not exceed 500 characters.");
  }

  return {
    isValid: errors.length === 0,
    errors,
    value: {
      action,
      note,
    },
  };
};

const validateRefundRequestsQuery = (query = {}) => {
  const pagination = validatePaginationQuery(query);
  const errors = [...pagination.errors];
  const status = normalizeOptionalString(query.status);

  if (status && !["pending_auto", "pending_manual", "approved", "rejected", "completed"].includes(status)) {
    errors.push("Status filter is invalid.");
  }

  return {
    isValid: errors.length === 0,
    errors,
    value: {
      ...pagination.value,
      status: status || undefined,
    },
  };
};

module.exports = {
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
};
