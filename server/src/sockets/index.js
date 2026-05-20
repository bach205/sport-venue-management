const { SOCKET_EVENTS } = require("../constants");
const matchingService = require("../modules/matching/service");

const SOCKET_DISCONNECT_GRACE_MS = 5000;

const registerSocketHandlers = (io) => {
  io.on(SOCKET_EVENTS.CONNECTION, (socket) => {
    console.log(`Socket connected: ${socket.id}`);
    
    socket.on(SOCKET_EVENTS.USER_JOIN, (userId) => {
      if (!userId) {
        return;
      }

      socket.data.userId = String(userId);
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

      const disconnectedUserId = socket.data?.userId;
      if (!disconnectedUserId) {
        return;
      }

      setTimeout(async () => {
        try {
          const sockets = await io.in(`user:${disconnectedUserId}`).fetchSockets();
          if (sockets.length > 0) {
            return;
          }

          const result = await matchingService.cancelPendingMatchRequestsByUser(disconnectedUserId);
          if (result.cancelledCount > 0) {
            console.log(
              `Cancelled ${result.cancelledCount} pending match request(s) for disconnected user ${disconnectedUserId}.`
            );
          }
        } catch (error) {
          console.error(
            `Failed to cancel pending match requests for disconnected user ${disconnectedUserId}:`,
            error
          );
        }
      }, SOCKET_DISCONNECT_GRACE_MS);
    });
  });
};

module.exports = registerSocketHandlers;
