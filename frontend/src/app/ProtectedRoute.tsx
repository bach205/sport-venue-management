import { Navigate, Outlet, useLocation } from "react-router";
import { useAppSelector } from "./hooks";

export default function ProtectedRoute() {
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);
  const allowGuestPreview = import.meta.env.VITE_ALLOW_GUEST_PREVIEW === "true";
  const location = useLocation();

  if (!isAuthenticated && !allowGuestPreview) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
}
