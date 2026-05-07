// Chat Routes - Define API endpoints
const express = require("express");
const asyncHandler = require("../../utils/asyncHandler");
const authMiddleware = require("../../middlewares/auth.middleware");
const chatController = require("./controller");

const router = express.Router();

// Room routes
router.get("/rooms", authMiddleware, asyncHandler((req, res) => chatController.getRooms(req, res)));
router.post("/rooms", authMiddleware, asyncHandler((req, res) => chatController.createRoom(req, res)));
router.put("/rooms/:roomId", authMiddleware, asyncHandler((req, res) => chatController.updateRoom(req, res)));
router.delete("/rooms/:roomId", authMiddleware, asyncHandler((req, res) => chatController.deleteRoom(req, res)));

// Join/Leave room
router.post("/rooms/:roomId/join", authMiddleware, asyncHandler((req, res) => chatController.joinRoom(req, res)));
router.post("/rooms/:roomId/leave", authMiddleware, asyncHandler((req, res) => chatController.leaveRoom(req, res)));

// Message routes
router.post("/rooms/:roomId/messages", authMiddleware, asyncHandler((req, res) => chatController.sendMessage(req, res)));
router.get("/rooms/:roomId/messages", authMiddleware, asyncHandler((req, res) => chatController.getMessages(req, res)));

module.exports = router;
