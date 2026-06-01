import { io, type Socket } from "socket.io-client";
import { getCurrentUser, getToken, subscribeAuth } from "@/features/auth/store/authStore";

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

const identifyCurrentUser = (): void => {
  const token = getToken();
  const user = getCurrentUser();
  if (!token || !user?._id) return;

  socket.auth = { token };
  socket.emit("user:join", {
    userId: user._id,
    token,
  });
};

export const connectSocket = (): Socket => {
  if (!socket.connected) {
    const token = getToken();
    socket.auth = token ? { token } : {};
    socket.connect();
  }

  return socket;
};

export const disconnectSocket = (): void => {
  socket.disconnect();
};

export const joinUserRoom = (userId: string): void => {
  if (!userId) return;

  connectSocket();
  socket.emit("user:join", {
    userId,
    token: getToken(),
  });
};

socket.on("connect", identifyCurrentUser);

subscribeAuth(() => {
  const token = getToken();
  if (!token) {
    disconnectSocket();
    return;
  }

  if (!socket.connected) {
    connectSocket();
    return;
  }

  identifyCurrentUser();
});

export { socket };
