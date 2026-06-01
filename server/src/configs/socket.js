const { Server } = require("socket.io");
const { createAdapter } = require("@socket.io/redis-adapter");
const { pubClient, subClient } = require("./redis");

const createSocketServer = (server, { redisReady = false } = {}) => {
  const io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || "*",
      credentials: true,
    },
  });

  if (redisReady) {
    io.adapter(createAdapter(pubClient, subClient));
  } else {
    console.warn("Redis unavailable. Socket.IO is using the in-memory adapter.");
  }

  return io;
};

module.exports = createSocketServer;
