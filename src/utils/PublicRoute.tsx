import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "./useAuth";
import Spinner from "../components/spinner/Spinner";

interface PublicRouteProps {
  children: React.ReactNode;
  restricted?: boolean; // If true, authenticated users can't access
  redirectTo?: string;
}

export const PublicRoute: React.FC<PublicRouteProps> = ({
  children,
  restricted = false,
  redirectTo = "/dashboard"
}) => {
  const { isAuthenticated, loading, user } = useAuth();

  if (loading) {
    return (
      <Spinner
        variant="ring"
        size="lg"
        modal
        label="Loading..."
        color="#f43f5e"
        accent="#22d3ee"
      />
    );
  }

  // If route is restricted and user is authenticated, redirect
  if (restricted && isAuthenticated && user) {
    return <Navigate to={`${redirectTo}/${user.id}`} replace />;
  }

  return <>{children}</>;
};