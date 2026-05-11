const express = require("express");

const asyncHandler = require("../../utils/asyncHandler");
const authMiddleware = require("../../middlewares/auth.middleware");
const chatController = require("./controller");

const router = express.Router();

router.post(
  "/conversations/direct",
  authMiddleware,
  asyncHandler((req, res) => chatController.createOrGetDirectConversation(req, res))
);
router.get(
  "/conversations",
  authMiddleware,
  asyncHandler((req, res) => chatController.listConversations(req, res))
);
router.get(
  "/conversations/:conversationId/messages",
  authMiddleware,
  asyncHandler((req, res) => chatController.getMessages(req, res))
);
router.post(
  "/conversations/:conversationId/messages",
  authMiddleware,
  asyncHandler((req, res) => chatController.sendMessage(req, res))
);
router.post(
  "/conversations/:conversationId/seen",
  authMiddleware,
  asyncHandler((req, res) => chatController.markSeen(req, res))
);

module.exports = router;
