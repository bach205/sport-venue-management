const { SOCKET_EVENTS } = require("../constants");
const { verifyToken } = require("../utils/jwt");
const matchingService = require("../modules/matching/service");
const { addUserSocket, isUserOnline, removeUserSocket } = require("./presence");

const SOCKET_DISCONNECT_GRACE_MS = 5000;

const registerSocketHandlers = (io) => {
  const registerUserSocket = (socket, userId) => {
    const normalizedUserId = String(userId);
    const previousUserId = socket.data.userId;

    if (previousUserId && previousUserId !== normalizedUserId) {
      removeUserSocket(previousUserId, socket.id);
      socket.leave(`user:${previousUserId}`);
    }

    socket.data.userId = normalizedUserId;
    socket.join(`user:${normalizedUserId}`);
    const becameOnline = addUserSocket(normalizedUserId, socket.id);
    if (becameOnline) {
      io.emit(SOCKET_EVENTS.USER_PRESENCE, {
        userId: normalizedUserId,
        isOnline: true,
      });
    }
  };

  const authenticateSocket = (socket, token, expectedUserId) => {
    if (!token) {
      return;
    }

    const payload = verifyToken(token);
    if (expectedUserId && String(payload.id) !== String(expectedUserId)) {
      return;
    }

    registerUserSocket(socket, payload.id);
  };

  io.on(SOCKET_EVENTS.CONNECTION, (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    try {
      authenticateSocket(socket, socket.handshake.auth?.token);
    } catch (error) {
      console.warn(`Rejected socket handshake for ${socket.id}.`);
    }

    socket.on(SOCKET_EVENTS.USER_JOIN, ({ userId, token } = {}) => {
      if (!userId || !token) {
        return;
      }

      try {
        authenticateSocket(socket, token, userId);
      } catch (error) {
        console.warn(`Rejected user room join for socket ${socket.id}.`);
      }
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

    socket.on(SOCKET_EVENTS.DISCONNECT, () => {
      console.log(`Socket disconnected: ${socket.id}`);

      const disconnectedUserId = socket.data?.userId;
      if (!disconnectedUserId) {
        return;
      }

      removeUserSocket(disconnectedUserId, socket.id);
      setTimeout(async () => {
        try {
          if (isUserOnline(disconnectedUserId)) {
            return;
          }

          io.emit(SOCKET_EVENTS.USER_PRESENCE, {
            userId: String(disconnectedUserId),
            isOnline: false,
          });

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
