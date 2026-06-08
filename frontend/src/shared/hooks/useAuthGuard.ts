import { toast } from "sonner";
import { useAppSelector } from "@/app/hooks";

export const LOGIN_REQUIRED_MESSAGE = "Bạn cần đăng nhập để sử dụng tính năng này.";

export function useAuthGuard() {
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);

  const requireAuth = (message = LOGIN_REQUIRED_MESSAGE) => {
    if (isAuthenticated) return true;

    toast.error(message);
    return false;
  };

  return { isAuthenticated, requireAuth };
}
