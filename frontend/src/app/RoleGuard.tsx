import { UserRole } from "@/features/auth/types/auth.types";
import { Navigate, Outlet } from "react-router";
import { useAppSelector } from "./hooks";

interface RoleGuardProps {
  allowedRoles: UserRole[];
  fallback?: string;
}

export default function RoleGuard({ allowedRoles, fallback = "/discover" }: RoleGuardProps) {
  const user = useAppSelector((state) => state.auth.user);

  if (!user || !allowedRoles.includes(user.role)) {
    return <Navigate to={fallback} replace />;
  }

  return <Outlet />;
}
