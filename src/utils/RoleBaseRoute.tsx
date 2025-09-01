// components/guards/RoleBasedRoute.tsx
import React from "react";
import { UserRole } from "./auth.types";
import { ProtectedRoute } from "./Protected";

interface RoleBasedRouteProps {
  children: React.ReactNode;
  allowedRoles: UserRole[];
}

export const RoleBasedRoute: React.FC<RoleBasedRouteProps> = ({
  children,
  allowedRoles
}) => {
  return (
    <ProtectedRoute requiredRoles={allowedRoles}>
      {children}
    </ProtectedRoute>
  );
};