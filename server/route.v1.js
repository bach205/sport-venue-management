const authRoutes = require("./src/modules/auth/route");
const userRoutes = require("./src/modules/user/route");
const chatRoutes = require("./src/modules/chat/route");

const router = require("express").Router();

router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/chat", chatRoutes);

module.exports = router;