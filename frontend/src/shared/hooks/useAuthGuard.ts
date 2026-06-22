import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { useAppSelector } from "@/app/hooks";

export function useAuthGuard() {
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);
  const { t } = useTranslation("auth");

  const requireAuth = (message?: string) => {
    if (isAuthenticated) return true;

    toast.error(message ?? t("login.required"));
    return false;
  };

  return { isAuthenticated, requireAuth };
}
