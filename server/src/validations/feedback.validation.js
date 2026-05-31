const mongoose = require("mongoose");
const { validatePaginationQuery } = require("./venue.validation");

const FEEDBACK_CATEGORIES = ["bug", "feature_request", "billing", "support", "other"];
const FEEDBACK_STATUSES = ["new", "reviewing", "resolved"];

const normalizeOptionalString = (value) =>
  value === undefined || value === null ? undefined : String(value).trim();

const validateCreateFeedbackPayload = (payload = {}) => {
  const errors = [];
  const category = normalizeOptionalString(payload.category);
  const subject = normalizeOptionalString(payload.subject);
  const message = normalizeOptionalString(payload.message);
  const ratingValue = payload.rating === undefined || payload.rating === null ? undefined : Number(payload.rating);

  if (!category) {
    errors.push("Category is required.");
  } else if (!FEEDBACK_CATEGORIES.includes(category)) {
    errors.push("Category is invalid.");
  }

  if (!subject) {
    errors.push("Subject is required.");
  } else if (subject.length < 3) {
    errors.push("Subject must be at least 3 characters.");
  } else if (subject.length > 120) {
    errors.push("Subject must not exceed 120 characters.");
  }

  if (!message) {
    errors.push("Message is required.");
  } else if (message.length < 1) {
    errors.push("Message must be at least 1 character.");
  } else if (message.length > 1000) {
    errors.push("Message must not exceed 1000 characters.");
  }

  if (ratingValue !== undefined) {
    if (!Number.isInteger(ratingValue)) {
      errors.push("Rating must be an integer.");
    } else if (ratingValue < 1 || ratingValue > 5) {
      errors.push("Rating must be between 1 and 5.");
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    value: {
      category,
      subject,
      message,
      rating: ratingValue,
    },
  };
};

const validateFeedbackListQuery = (query = {}) => {
  const pagination = validatePaginationQuery(query);
  const errors = [...pagination.errors];
  const status = normalizeOptionalString(query.status);
  const search = normalizeOptionalString(query.q) || "";

  if (status && !FEEDBACK_STATUSES.includes(status)) {
    errors.push("Feedback status filter is invalid.");
  }

  if (search.length > 120) {
    errors.push("Search query must not exceed 120 characters.");
  }

  return {
    isValid: errors.length === 0,
    errors,
    value: {
      ...pagination.value,
      status: status || undefined,
      q: search,
    },
  };
};

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

module.exports = {
  FEEDBACK_CATEGORIES,
  FEEDBACK_STATUSES,
  validateCreateFeedbackPayload,
  validateFeedbackListQuery,
  validateObjectIdParam,
};
