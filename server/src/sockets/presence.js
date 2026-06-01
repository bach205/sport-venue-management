const socketsByUserId = new Map();

const addUserSocket = (userId, socketId) => {
  const normalizedUserId = String(userId);
  const socketIds = socketsByUserId.get(normalizedUserId) || new Set();
  const wasOnline = socketIds.size > 0;

  socketIds.add(socketId);
  socketsByUserId.set(normalizedUserId, socketIds);

  return !wasOnline;
};

const removeUserSocket = (userId, socketId) => {
  const normalizedUserId = String(userId);
  const socketIds = socketsByUserId.get(normalizedUserId);

  if (!socketIds) {
    return false;
  }

  socketIds.delete(socketId);
  if (socketIds.size === 0) {
    socketsByUserId.delete(normalizedUserId);
    return true;
  }

  return false;
};

const isUserOnline = (userId) => Boolean(userId && socketsByUserId.has(String(userId)));

module.exports = {
  addUserSocket,
  removeUserSocket,
  isUserOnline,
};
