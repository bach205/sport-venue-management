import { io, type Socket } from "socket.io-client";

const normalizeSocketUrl = (apiBaseUrl?: string) => {
  if (!apiBaseUrl) {
    return "http://localhost:4000";
  }

  return apiBaseUrl.replace(/\/api(\/v\d+)?$/, "");
};

const socketUrl =
  import.meta.env.VITE_SOCKET_URL || normalizeSocketUrl(import.meta.env.VITE_API_BASE_URL);

const socket: Socket = io(socketUrl, {
  autoConnect: false,
  transports: ["websocket"],
});

export const connectSocket = (): Socket => {
  if (!socket.connected) {
    const token = localStorage.getItem("accessToken");
    socket.auth = token ? { token } : {};
    socket.connect();
  }

  return socket;
};

export const disconnectSocket = (): void => {
  if (socket.connected) {
    socket.disconnect();
  }
};

export { socket };
