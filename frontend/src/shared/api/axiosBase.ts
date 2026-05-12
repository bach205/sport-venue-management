// axiosBase.ts
import { getToken } from "@/features/auth/store/authStore";
import axios, { AxiosInstance } from "axios";

export const createAxiosInstance = (baseURL: string): AxiosInstance => {
  const instance = axios.create({
    baseURL,
    timeout: 10000,
    headers: {
      "Content-Type": "application/json",
    },
  });

  // attach token
  instance.interceptors.request.use((config) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  // handle 401
  instance.interceptors.response.use(
    (res) => res,
    (error) => {
      if (error.response?.status === 401) {
        localStorage.removeItem("accessToken");
        window.location.href = "/login";
      }
      return Promise.reject(error);
    }
  );

  return instance;
};