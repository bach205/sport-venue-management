const { HTTP_STATUS } = require("../constants");

const errorMiddleware = (error, req, res, next) => {
  const statusCode = error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR;

  res.status(statusCode).json({
    message: error.message || "Internal server error.",
    stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
  });
};

module.exports = errorMiddleware;
