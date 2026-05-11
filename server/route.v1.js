const authRoutes = require("./src/modules/auth/route");
const userRoutes = require("./src/modules/user/route");
const chatRoutes = require("./src/modules/chat/route");
const matchingRoutes = require("./src/modules/matching/route");
const socialRoutes = require("./src/modules/social/route");
const venueRoutes = require("./src/modules/venue/route");

const router = require("express").Router();

router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/chat", chatRoutes);
router.use("/matching", matchingRoutes);
router.use("/social", socialRoutes);
router.use("/", venueRoutes);

module.exports = router;
