const { HTTP_STATUS } = require("../constants");

const requireRole = (...requiredRoles) => (req, res, next) => {
  const userRoles = Array.isArray(req.user?.roles) ? req.user.roles : [];
  const isAllowed = requiredRoles.some((role) => userRoles.includes(role));

  if (!isAllowed) {
    return res.status(HTTP_STATUS.FORBIDDEN).json({
      message: "You do not have permission to access this resource.",
    });
  }

  return next();
};

module.exports = requireRole;
