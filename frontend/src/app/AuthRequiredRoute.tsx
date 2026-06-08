import { useEffect } from "react";
import { Navigate, useLocation } from "react-router";
import { toast } from "sonner";
import { useAppSelector } from "./hooks";
import { LOGIN_REQUIRED_MESSAGE } from "@/shared/hooks/useAuthGuard";

export default function AuthRequiredRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);
  const allowGuestPreview = import.meta.env.VITE_ALLOW_GUEST_PREVIEW === "true";
  const location = useLocation();

  useEffect(() => {
    if (!isAuthenticated && allowGuestPreview) {
      toast.error(LOGIN_REQUIRED_MESSAGE);
    }
  }, [allowGuestPreview, isAuthenticated]);

  if (!isAuthenticated && allowGuestPreview) {
    return <Navigate to="/discover" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
