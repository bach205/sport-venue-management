const express = require("express");
const asyncHandler = require("../../utils/asyncHandler");
const viewController = require("./controller");

const router = express.Router();

router.post("/views/track", asyncHandler((req, res) => viewController.trackView(req, res)));
router.get("/views/total", asyncHandler((req, res) => viewController.getTotalViews(req, res)));

module.exports = router;
