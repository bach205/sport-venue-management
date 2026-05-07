// User Routes - Define API endpoints
const express = require("express");
const asyncHandler = require("../../utils/asyncHandler");
const authMiddleware = require("../../middlewares/auth.middleware");
const userController = require("./controller");

const router = express.Router();

router.get("/me", authMiddleware, asyncHandler((req, res) => userController.getMe(req, res)));
router.put("/profile", authMiddleware, asyncHandler((req, res) => userController.updateProfile(req, res)));
router.get("/search", authMiddleware, asyncHandler((req, res) => userController.searchUsers(req, res)));

module.exports = router;
