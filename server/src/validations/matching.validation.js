const mongoose = require("mongoose");

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;
const SKILL_LEVELS = ["casual", "intermediate", "competitive"];
const MATCH_TYPES = ["teammate", "opponent"];
const TIME_TYPES = ["fixed", "flexible"];
const DISCOVER_STATUSES = ["open", "closed", "cancelled"];
const MAX_CONTENT_LENGTH = 2000;
const MIN_RADIUS_KM = 1;
const MAX_RADIUS_KM = 50;

const validateObjectIdParam = (value, fieldLabel = "Resource") => {
  const errors = [];

  if (!value) {
    errors.push(`${fieldLabel} id is required.`);
  } else if (!mongoose.Types.ObjectId.isValid(value)) {
    errors.push(`${fieldLabel} id is invalid.`);
  }

  return { isValid: errors.length === 0, errors };
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
        Number.isInteger(limit) && limit > 0 && limit <= MAX_LIMIT ? limit : DEFAULT_LIMIT,
    },
  };
};

const validateEnum = (value, allowedValues, fieldLabel, errors) => {
  if (!value) {
    errors.push(`${fieldLabel} is required.`);
    return;
  }

  if (!allowedValues.includes(value)) {
    errors.push(`${fieldLabel} must be one of: ${allowedValues.join(", ")}.`);
  }
};

const validateFutureDate = (value, fieldLabel, errors) => {
  if (!value) {
    errors.push(`${fieldLabel} is required.`);
    return null;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    errors.push(`${fieldLabel} must be a valid date.`);
    return null;
  }

  if (date.getTime() < Date.now()) {
    errors.push(`${fieldLabel} must not be in the past.`);
  }

  return date;
};

const validateBaseMatchingPayload = (payload = {}, options = {}) => {
  const errors = [];

  if (!payload.sport || String(payload.sport).trim() === "") {
    errors.push("Sport is required.");
  }

  if (!payload.location || String(payload.location).trim() === "") {
    errors.push("Location is required.");
  }

  const hasLat = payload.location_lat !== undefined && payload.location_lat !== null && payload.location_lat !== "";
  const hasLng = payload.location_lng !== undefined && payload.location_lng !== null && payload.location_lng !== "";

  if (hasLat || hasLng) {
    const lat = Number(payload.location_lat);
    const lng = Number(payload.location_lng);

    if (!Number.isFinite(lat) || lat < -90 || lat > 90) {
      errors.push("Location latitude must be a valid number between -90 and 90.");
    }

    if (!Number.isFinite(lng) || lng < -180 || lng > 180) {
      errors.push("Location longitude must be a valid number between -180 and 180.");
    }

    const radiusKm = payload.search_radius_km === undefined ? 5 : Number(payload.search_radius_km);
    if (!Number.isFinite(radiusKm) || radiusKm < MIN_RADIUS_KM || radiusKm > MAX_RADIUS_KM) {
      errors.push(`Search radius must be between ${MIN_RADIUS_KM} and ${MAX_RADIUS_KM} kilometers.`);
    }
  }

  // validateFutureDate(payload.time, "Time", errors);
  validateEnum(payload.time_type, TIME_TYPES, "Time type", errors);
  validateEnum(payload.skill_level, SKILL_LEVELS, "Skill level", errors);
  validateEnum(payload.match_type, MATCH_TYPES, "Match type", errors);

  const numberOfPlayers = Number(payload.number_of_players);
  if (!Number.isInteger(numberOfPlayers) || numberOfPlayers < 1) {
    errors.push("Number of players must be a positive integer.");
  } else if (options.requireSinglePlayer && numberOfPlayers !== 1) {
    errors.push("Number of players must equal 1 for auto matching.");
  }

  return { errors };
};

const validateCreateMatchRequestPayload = (payload = {}) => {
  const { errors } = validateBaseMatchingPayload(payload, { requireSinglePlayer: true });

  return { isValid: errors.length === 0, errors };
};

const validateCreateDiscoverPostPayload = (payload = {}) => {
  const { errors } = validateBaseMatchingPayload(payload);

  if (payload.content === undefined || payload.content === null || String(payload.content).trim() === "") {
    errors.push("Content is required.");
  } else if (String(payload.content).trim().length > MAX_CONTENT_LENGTH) {
    errors.push(`Content must not exceed ${MAX_CONTENT_LENGTH} characters.`);
  }

  return { isValid: errors.length === 0, errors };
};

const validateUpdateDiscoverPostPayload = (payload = {}) => {
  const errors = [];
  const hasFields = Object.keys(payload).length > 0;

  if (!hasFields) {
    errors.push("At least one field is required.");
  }

  if (payload.sport !== undefined && String(payload.sport).trim() === "") {
    errors.push("Sport must not be empty.");
  }

  if (payload.location !== undefined && String(payload.location).trim() === "") {
    errors.push("Location must not be empty.");
  }

  if (payload.time !== undefined) {
    const date = new Date(payload.time);
    if (Number.isNaN(date.getTime())) {
      errors.push("Time must be a valid date.");
    } else if (date.getTime() < Date.now()) {
      errors.push("Time must not be in the past.");
    }
  }

  if (payload.time_type !== undefined) {
    validateEnum(payload.time_type, TIME_TYPES, "Time type", errors);
  }

  if (payload.skill_level !== undefined) {
    validateEnum(payload.skill_level, SKILL_LEVELS, "Skill level", errors);
  }

  if (payload.match_type !== undefined) {
    validateEnum(payload.match_type, MATCH_TYPES, "Match type", errors);
  }

  if (payload.number_of_players !== undefined) {
    const numberOfPlayers = Number(payload.number_of_players);
    if (!Number.isInteger(numberOfPlayers) || numberOfPlayers < 1) {
      errors.push("Number of players must be a positive integer.");
    }
  }

  if (payload.content !== undefined) {
    if (String(payload.content).trim() === "") {
      errors.push("Content must not be empty.");
    } else if (String(payload.content).trim().length > MAX_CONTENT_LENGTH) {
      errors.push(`Content must not exceed ${MAX_CONTENT_LENGTH} characters.`);
    }
  }

  if (payload.status !== undefined && !DISCOVER_STATUSES.includes(payload.status)) {
    errors.push(`Status must be one of: ${DISCOVER_STATUSES.join(", ")}.`);
  }

  return { isValid: errors.length === 0, errors };
};

const validateDiscoverListQuery = (query = {}) => {
  const pagination = validatePaginationQuery(query);
  const errors = [...pagination.errors];

  if (query.skill_level !== undefined && !SKILL_LEVELS.includes(query.skill_level)) {
    errors.push(`Skill level must be one of: ${SKILL_LEVELS.join(", ")}.`);
  }

  if (query.match_type !== undefined && !MATCH_TYPES.includes(query.match_type)) {
    errors.push(`Match type must be one of: ${MATCH_TYPES.join(", ")}.`);
  }

  ["time_from", "time_to"].forEach((field) => {
    if (query[field] !== undefined) {
      const date = new Date(query[field]);
      if (Number.isNaN(date.getTime())) {
        errors.push(`${field} must be a valid date.`);
      }
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
    value: pagination.value,
  };
};

const validateCreateMatchRatingPayload = (payload = {}) => {
  const errors = [];
  const rating = Number(payload.rating);

  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    errors.push("Rating must be an integer from 1 to 5.");
  }

  return {
    isValid: errors.length === 0,
    errors,
    value: { rating },
  };
};

module.exports = {
  validateObjectIdParam,
  validatePaginationQuery,
  validateCreateMatchRequestPayload,
  validateCreateDiscoverPostPayload,
  validateUpdateDiscoverPostPayload,
  validateDiscoverListQuery,
  validateCreateMatchRatingPayload,
};
