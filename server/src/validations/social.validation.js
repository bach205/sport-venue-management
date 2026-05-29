const mongoose = require("mongoose");

const MAX_CONTENT_LENGTH = 2000;
const MAX_IMAGE_URL_LENGTH = 1000;
const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;
const MAX_SEARCH_LENGTH = 100;

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

const validateOptionalImageUrl = (imageUrl, errors) => {
  if (imageUrl === undefined || imageUrl === null || String(imageUrl).trim() === "") {
    return;
  }

  if (String(imageUrl).trim().length > MAX_IMAGE_URL_LENGTH) {
    errors.push(`Image URL must not exceed ${MAX_IMAGE_URL_LENGTH} characters.`);
  }
};

const validateOptionalPostContent = (content, errors) => {
  if (content === undefined || content === null || String(content).trim() === "") {
    return;
  }

  if (String(content).trim().length > MAX_CONTENT_LENGTH) {
    errors.push(`Content must not exceed ${MAX_CONTENT_LENGTH} characters.`);
  }
};

const validateCreatePostPayload = (payload = {}) => {
  const errors = [];

  validateOptionalPostContent(payload.content, errors);
  validateOptionalImageUrl(payload.image_url, errors);

  if (
    (payload.content === undefined || payload.content === null || String(payload.content).trim() === "") &&
    (payload.image_url === undefined || payload.image_url === null || String(payload.image_url).trim() === "")
  ) {
    errors.push("Content or image is required.");
  }

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
  validateOptionalImageUrl(payload.image_url, errors);

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

const validateSearchQuery = (query = {}) => {
  const errors = [];
  const pagination = validatePaginationQuery(query);
  const q = query.q === undefined ? "" : String(query.q).trim();

  if (q.length > MAX_SEARCH_LENGTH) {
    errors.push(`Search query must not exceed ${MAX_SEARCH_LENGTH} characters.`);
  }

  return {
    isValid: errors.length === 0 && pagination.isValid,
    errors: [...errors, ...pagination.errors],
    value: {
      q,
      page: pagination.value.page,
      limit: pagination.value.limit,
    },
  };
};

module.exports = {
  validateCreatePostPayload,
  validateUpdatePostPayload,
  validateCreateCommentPayload,
  validateUpdateCommentPayload,
  validatePaginationQuery,
  validateObjectIdParam,
  validateSearchQuery,
};
