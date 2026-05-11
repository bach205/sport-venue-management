require("dotenv").config();
const http = require("http");


const app = require("./app");
const connectDb = require("./src/configs/db");
const connectRedis = require("./src/configs/redis");
const createSocketServer = require("./src/configs/socket");
const registerSocketHandlers = require("./src/sockets");

const PORT = process.env.PORT || 5000;

const bootstrap = async () => {
  await connectDb();
  await connectRedis();

  const server = http.createServer(app);
  const io = createSocketServer(server);
  app.set("io", io);

  registerSocketHandlers(io);

  server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
};

bootstrap().catch((error) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});
