const mongoose = require("mongoose");

const MAX_CONTENT_LENGTH = 2000;
const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

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

  if (!Number.isInteger(page) || page < 1) {
    errors.push("Page must be a positive integer.");
  }

  if (!Number.isInteger(limit) || limit < 1) {
    errors.push("Limit must be a positive integer.");
  }

  if (Number.isInteger(limit) && limit > MAX_LIMIT) {
    errors.push(`Limit must not exceed ${MAX_LIMIT}.`);
  }

  return {
    isValid: errors.length === 0,
    errors,
    value: {
      page: Number.isInteger(page) && page > 0 ? page : DEFAULT_PAGE,
      limit:
        Number.isInteger(limit) && limit > 0 && limit <= MAX_LIMIT
          ? limit
          : DEFAULT_LIMIT,
    },
  };
};

const validateCreateDirectConversationPayload = (payload = {}) => {
  return validateObjectIdParam(payload.target_user_id, "Target user");
};

const validateSendMessagePayload = (payload = {}) => {
  const errors = [];

  if (payload.content === undefined || payload.content === null || String(payload.content).trim() === "") {
    errors.push("Content is required.");
  } else if (String(payload.content).trim().length > MAX_CONTENT_LENGTH) {
    errors.push(`Content must not exceed ${MAX_CONTENT_LENGTH} characters.`);
  }

  if (payload.attachments !== undefined && !Array.isArray(payload.attachments)) {
    errors.push("Attachments must be an array.");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

module.exports = {
  validateObjectIdParam,
  validatePaginationQuery,
  validateCreateDirectConversationPayload,
  validateSendMessagePayload,
};
