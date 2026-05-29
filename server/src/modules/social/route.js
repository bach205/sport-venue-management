const express = require("express");
const asyncHandler = require("../../utils/asyncHandler");
const authMiddleware = require("../../middlewares/auth.middleware");
const socialController = require("./controller");

const router = express.Router();

router.post("/posts", authMiddleware, asyncHandler((req, res) => socialController.createPost(req, res)));
router.get("/feed", authMiddleware, asyncHandler((req, res) => socialController.getFeed(req, res)));
router.get("/posts/search", authMiddleware, asyncHandler((req, res) => socialController.searchFeed(req, res)));
router.get("/posts/:postId", authMiddleware, asyncHandler((req, res) => socialController.getPostDetail(req, res)));
router.patch("/posts/:postId", authMiddleware, asyncHandler((req, res) => socialController.updatePost(req, res)));
router.delete("/posts/:postId", authMiddleware, asyncHandler((req, res) => socialController.deletePost(req, res)));

router.post("/posts/:postId/like", authMiddleware, asyncHandler((req, res) => socialController.likePost(req, res)));
router.delete("/posts/:postId/like", authMiddleware, asyncHandler((req, res) => socialController.unlikePost(req, res)));

router.post("/posts/:postId/comments", authMiddleware, asyncHandler((req, res) => socialController.createComment(req, res)));
router.get("/posts/:postId/comments", authMiddleware, asyncHandler((req, res) => socialController.getPostComments(req, res)));
router.patch("/comments/:commentId", authMiddleware, asyncHandler((req, res) => socialController.updateComment(req, res)));
router.delete("/comments/:commentId", authMiddleware, asyncHandler((req, res) => socialController.deleteComment(req, res)));

module.exports = router;
