const { HTTP_STATUS } = require("../constants");
const { verifyToken } = require("../utils/jwt");
const { User } = require("../modules/user/model");
const { UserRole } = require("../modules/user/model");

const authMiddleware = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(HTTP_STATUS.UNAUTHORIZED).json({
      message: "Unauthorized.",
    });
  }

  const token = authHeader.split(" ")[1];

  try {
    const payload = verifyToken(token);
    const [user, roles] = await Promise.all([
      User.findById(payload.id),
      UserRole.find({ user_id: payload.id }),
    ]);

    if (!user) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        message: "User not found.",
      });
    }

    if (user.status === "banned") {
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        message: "This account has been banned.",
      });
    }

    req.user = {
      id: String(user._id),
      email: user.email,
      status: user.status,
      is_verified: user.is_verified,
      roles: roles.map((role) => role.role),
    };

    return next();
  } catch (error) {
    return res.status(HTTP_STATUS.UNAUTHORIZED).json({
      message: "Invalid or expired token.",
    });
  }
};

module.exports = authMiddleware;
