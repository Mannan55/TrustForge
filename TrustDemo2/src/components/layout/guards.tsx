import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

/** Gate that redirects unauthenticated visitors to sign in. */
export function RequireAuth({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  return <>{children}</>;
}

/** Gate for the admin console. Non-admins are sent back to their workspace. */
export function RequireAdmin({ children }: { children: ReactNode }) {
  const { isAuthenticated, user } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user?.role !== "Super Admin" && user?.role !== "Platform Admin") {
    return <Navigate to="/dashboard" replace />;
  }
  return <>{children}</>;
}
