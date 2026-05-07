const { Server } = require("socket.io");

const createSocketServer = (server) =>
  new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || "*",
      credentials: true,
    },
  });

module.exports = createSocketServer;
