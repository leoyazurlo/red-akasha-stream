import React, { type ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuthGuard } from "@/hooks/use-auth-guard";
import { Loader2 } from "lucide-react";

type AppRole = "admin" | "moderator" | "user";

interface Props {
  children: ReactNode;
  roles?: AppRole[];
}

const Loader = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <Loader2 className="h-8 w-8 animate-spin text-primary" />
  </div>
);

/**
 * Wraps a route to enforce authentication + optional role check.
 *
 * - No session → redirect to /auth
 * - Session but wrong role → redirect to /unauthorized
 */
export const ProtectedRoute: React.FC<Props> = ({ children, roles = [] }) => {
  const { loading, authenticated, authorised } = useAuthGuard(roles);

  if (loading) return <Loader />;
  if (!authenticated) return <Navigate to="/auth" replace />;
  if (roles.length > 0 && !authorised) return <Navigate to="/unauthorized" replace />;

  return <>{children}</>;
};
