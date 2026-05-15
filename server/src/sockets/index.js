const { SOCKET_EVENTS } = require("../constants");

const registerSocketHandlers = (io) => {
  io.on(SOCKET_EVENTS.CONNECTION, (socket) => {
    console.log(`Socket connected: ${socket.id}`);
    
    socket.on(SOCKET_EVENTS.USER_JOIN, (userId) => {
      if (!userId) {
        return;
      }

      socket.join(`user:${userId}`);
    });

    socket.on(SOCKET_EVENTS.CHAT_JOIN, (roomId) => {
      socket.join(roomId);
    });

    socket.on(SOCKET_EVENTS.CHAT_MESSAGE, ({ roomId, message, sender }) => {
      io.to(roomId).emit(SOCKET_EVENTS.CHAT_MESSAGE, {
        roomId,
        message,
        sender,
      });
    });

    socket.on(SOCKET_EVENTS.MATCHING_REQUEST_CLIENT_MATCHED, (payload) => {
      const targetUserId = payload?.targetUserId;
      if (!targetUserId) {
        return;
      }
      
      const forwardPayload = payload?.data ?? payload;
      const nextPayload =
        forwardPayload && typeof forwardPayload === "object"
          ? { ...forwardPayload, clientEcho: true }
          : { clientEcho: true };

      io.to(`user:${targetUserId}`).emit(SOCKET_EVENTS.MATCHING_REQUEST_MATCHED, nextPayload);
    });

    socket.on(SOCKET_EVENTS.DISCONNECT, () => {
      console.log(`Socket disconnected: ${socket.id}`);
    });
  });
};

module.exports = registerSocketHandlers;
