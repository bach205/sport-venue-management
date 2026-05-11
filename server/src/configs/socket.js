const { Server } = require("socket.io");
const { createAdapter } = require("@socket.io/redis-adapter");
const { pubClient, subClient } = require("./redis");

const createSocketServer = (server) => {
  const io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || "*",
      credentials: true,
    },
  });

  io.adapter(createAdapter(pubClient, subClient));

  return io;
};

module.exports = createSocketServer;
