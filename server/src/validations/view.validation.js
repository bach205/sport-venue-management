const MAX_TARGET_TYPE_LENGTH = 40;
const MAX_TARGET_ID_LENGTH = 300;

const validateTrackViewPayload = (payload = {}) => {
  const errors = [];
  const targetType =
    payload.targetType === undefined || payload.targetType === null
      ? "page"
      : String(payload.targetType).trim();
  const targetId =
    payload.targetId === undefined || payload.targetId === null
      ? ""
      : String(payload.targetId).trim();

  if (!targetType) {
    errors.push("Target type is required.");
  } else if (targetType.length > MAX_TARGET_TYPE_LENGTH) {
    errors.push(`Target type must not exceed ${MAX_TARGET_TYPE_LENGTH} characters.`);
  }

  if (!targetId) {
    errors.push("Target id is required.");
  } else if (targetId.length > MAX_TARGET_ID_LENGTH) {
    errors.push(`Target id must not exceed ${MAX_TARGET_ID_LENGTH} characters.`);
  }

  return {
    isValid: errors.length === 0,
    errors,
    value: {
      targetType,
      targetId,
    },
  };
};

module.exports = {
  validateTrackViewPayload,
};
