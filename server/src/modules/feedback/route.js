const express = require("express");

const asyncHandler = require("../../utils/asyncHandler");
const authMiddleware = require("../../middlewares/auth.middleware");
const requireRole = require("../../middlewares/requireRole.middleware");
const feedbackController = require("./controller");

const router = express.Router();

router.post(
  "/feedbacks",
  authMiddleware,
  asyncHandler((req, res) => feedbackController.createFeedback(req, res))
);
router.get(
  "/feedbacks/me",
  authMiddleware,
  asyncHandler((req, res) => feedbackController.getMyFeedbacks(req, res))
);
router.get(
  "/admin/feedbacks",
  authMiddleware,
  requireRole("admin"),
  asyncHandler((req, res) => feedbackController.listAdminFeedbacks(req, res))
);

module.exports = router;
