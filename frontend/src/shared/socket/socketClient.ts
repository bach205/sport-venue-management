import { io, type Socket } from "socket.io-client";
import { getToken } from "@/features/auth/store/authStore";

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
    const token = getToken();
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

export const joinUserRoom = (userId: string): void => {
  if (!userId) return;

  connectSocket();
  socket.emit("user:join", {
    userId,
    token: getToken(),
  });
};

export { socket };
