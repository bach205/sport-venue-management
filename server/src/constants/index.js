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
  USER_JOIN: "user:join",
  CHAT_MESSAGE: "chat:message",
  CHAT_JOIN: "chat:join",
  MATCHING_REQUEST_CREATED: "matching:request:created",
  MATCHING_REQUEST_MATCHED: "matching:request:matched",
  DISCOVER_CONTACT_STARTED: "discover:contact:started",
};

module.exports = {
  HTTP_STATUS,
  SOCKET_EVENTS,
};
