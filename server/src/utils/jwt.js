const jwt = require("jsonwebtoken");

const signToken = (payload, options = {}) => {
  const secret = process.env.JWT_SECRET || "your_jwt_secret";
  return jwt.sign(payload, secret, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
    ...options,
  });
};

const verifyToken = (token) => {
  const secret = process.env.JWT_SECRET || "your_jwt_secret";
  return jwt.verify(token, secret);
};

module.exports = {
  signToken,
  verifyToken,
};
