const express = require("express");

const asyncHandler = require("../../utils/asyncHandler");
const authMiddleware = require("../../middlewares/auth.middleware");
const matchingController = require("./controller");

const router = express.Router();

router.post("/requests", authMiddleware, asyncHandler((req, res) => matchingController.createMatchRequest(req, res)));
router.get("/requests/me", authMiddleware, asyncHandler((req, res) => matchingController.getMyMatchRequests(req, res)));
router.get("/requests/me/:requestId", authMiddleware, asyncHandler((req, res) => matchingController.getMyMatchRequestById(req, res)));
router.patch("/requests/:requestId/cancel", authMiddleware, asyncHandler((req, res) => matchingController.cancelMatchRequest(req, res)));

router.get("/matches/me", authMiddleware, asyncHandler((req, res) => matchingController.listMyMatches(req, res)));
router.get("/matches/:matchId", authMiddleware, asyncHandler((req, res) => matchingController.getMatchById(req, res)));
router.post("/matches/:matchId/rating", authMiddleware, asyncHandler((req, res) => matchingController.rateMatch(req, res)));

router.post("/discover-posts", authMiddleware, asyncHandler((req, res) => matchingController.createDiscoverPost(req, res)));
router.get("/discover-posts", authMiddleware, asyncHandler((req, res) => matchingController.listDiscoverPosts(req, res)));
router.get("/discover-posts/:postId", authMiddleware, asyncHandler((req, res) => matchingController.getDiscoverPostById(req, res)));
router.patch("/discover-posts/:postId", authMiddleware, asyncHandler((req, res) => matchingController.updateDiscoverPost(req, res)));
router.patch("/discover-posts/:postId/close", authMiddleware, asyncHandler((req, res) => matchingController.closeDiscoverPost(req, res)));
router.delete("/discover-posts/:postId", authMiddleware, asyncHandler((req, res) => matchingController.deleteDiscoverPost(req, res)));
router.post("/discover-posts/:postId/contact", authMiddleware, asyncHandler((req, res) => matchingController.contactDiscoverPost(req, res)));

module.exports = router;
