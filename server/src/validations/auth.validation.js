const validateRegisterPayload = (payload = {}) => {
  const errors = [];

  if (!payload.email) {
    errors.push("Email is required.");
  }

  if (!payload.password) {
    errors.push("Password is required.");
  }

  if (payload.password && payload.password.length < 6) {
    errors.push("Password must be at least 6 characters.");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

const validateLoginPayload = (payload = {}) => {
  const errors = [];

  if (!payload.email) {
    errors.push("Email is required.");
  }

  if (!payload.password) {
    errors.push("Password is required.");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

const validateVerifyEmailPayload = (payload = {}) => {
  const errors = [];

  if (!payload.token) {
    errors.push("Verification token is required.");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

module.exports = {
  validateRegisterPayload,
  validateLoginPayload,
  validateVerifyEmailPayload,
};
