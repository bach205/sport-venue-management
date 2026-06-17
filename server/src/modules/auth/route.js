// Auth Routes - Define API endpoints
const express = require("express");
const asyncHandler = require("../../utils/asyncHandler");
const authController = require("./controller");
const authMiddleware = require("../../middlewares/auth.middleware");

const router = express.Router();

router.post("/register", asyncHandler((req, res) => authController.register(req, res)));
router.post("/login", asyncHandler((req, res) => authController.login(req, res)));
router.post("/verify-email", asyncHandler((req, res) => authController.verifyEmail(req, res)));
router.post("/forgot-password", asyncHandler((req, res) => authController.forgotPassword(req, res)));
router.post("/reset-password", asyncHandler((req, res) => authController.resetPassword(req, res)));
router.post("/logout", authMiddleware, asyncHandler((req, res) => authController.logout(req, res)));

module.exports = router;
