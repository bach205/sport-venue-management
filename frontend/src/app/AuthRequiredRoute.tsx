import { useEffect } from "react";
import { Navigate, useLocation } from "react-router";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { useAppSelector } from "./hooks";

export default function AuthRequiredRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);
  const { t } = useTranslation("auth");
  const allowGuestPreview = import.meta.env.VITE_ALLOW_GUEST_PREVIEW === "true";
  const location = useLocation();

  useEffect(() => {
    if (!isAuthenticated && allowGuestPreview) {
      toast.error(t("login.required"));
    }
  }, [allowGuestPreview, isAuthenticated, t]);

  if (!isAuthenticated && allowGuestPreview) {
    return <Navigate to="/discover" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
