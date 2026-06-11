const authRoutes = require("./src/modules/auth/route");
const userRoutes = require("./src/modules/user/route");
const chatRoutes = require("./src/modules/chat/route");
const matchingRoutes = require("./src/modules/matching/route");
const socialRoutes = require("./src/modules/social/route");
const feedbackRoutes = require("./src/modules/feedback/route");
const venueRoutes = require("./src/modules/venue/route");
const walletRoutes = require("./src/modules/wallet/route");
const viewRoutes = require("./src/modules/view/route");
const { registerUploadRoute } = require("./src/modules/upload/UploadRoute");

const router = require("express").Router();

router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/chat", chatRoutes);
router.use("/matching", matchingRoutes);
router.use("/social", socialRoutes);
router.use("/", viewRoutes);
router.use("/", feedbackRoutes);
registerUploadRoute(router);
router.use("/", venueRoutes);
router.use("/", walletRoutes);

module.exports = router;
