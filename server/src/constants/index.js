const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500,
};

const SOCKET_EVENTS = {
  CONNECTION: "connection",
  DISCONNECT: "disconnect",
  CHAT_MESSAGE: "chat:message",
  CHAT_JOIN: "chat:join",
};

module.exports = {
  HTTP_STATUS,
  SOCKET_EVENTS,
};
