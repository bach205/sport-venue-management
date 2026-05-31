import { createAxiosInstance } from "./axiosBase";

export const apiRouteClient = createAxiosInstance(
  import.meta.env.VITE_API_ROUTE || import.meta.env.VITE_API_BASE_URL
);
