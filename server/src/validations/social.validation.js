const mongoose = require("mongoose");

const MAX_CONTENT_LENGTH = 2000;
const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

const validateRequiredContent = (content, fieldLabel, errors) => {
  if (content === undefined || content === null || String(content).trim() === "") {
    errors.push(`${fieldLabel} is required.`);
    return;
  }

  if (String(content).trim().length > MAX_CONTENT_LENGTH) {
    errors.push(`${fieldLabel} must not exceed ${MAX_CONTENT_LENGTH} characters.`);
  }
};

const validateOptionalContent = (content, fieldLabel, errors) => {
  if (content === undefined) {
    return;
  }

  if (content === null || String(content).trim() === "") {
    errors.push(`${fieldLabel} is required.`);
    return;
  }

  if (String(content).trim().length > MAX_CONTENT_LENGTH) {
    errors.push(`${fieldLabel} must not exceed ${MAX_CONTENT_LENGTH} characters.`);
  }
};

const validateCreatePostPayload = (payload = {}) => {
  const errors = [];

  validateRequiredContent(payload.content, "Content", errors);

  return {
    isValid: errors.length === 0,
    errors,
  };
};

const validateUpdatePostPayload = (payload = {}) => {
  const errors = [];

  if (Object.keys(payload).length === 0) {
    errors.push("At least one field is required.");
  }

  validateOptionalContent(payload.content, "Content", errors);

  return {
    isValid: errors.length === 0,
    errors,
  };
};

const validateCreateCommentPayload = (payload = {}) => {
  const errors = [];

  validateRequiredContent(payload.content, "Content", errors);

  return {
    isValid: errors.length === 0,
    errors,
  };
};

const validateUpdateCommentPayload = (payload = {}) => {
  const errors = [];

  if (Object.keys(payload).length === 0) {
    errors.push("At least one field is required.");
  }

  validateOptionalContent(payload.content, "Content", errors);

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
  validateCreatePostPayload,
  validateUpdatePostPayload,
  validateCreateCommentPayload,
  validateUpdateCommentPayload,
  validatePaginationQuery,
  validateObjectIdParam,
};
