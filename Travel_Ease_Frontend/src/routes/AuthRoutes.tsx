/**
 * Auth-Aware Routing Components
 * 
 * RequireAuth: Protects routes that require authentication
 * LandingRoute: Shows blogs for visitors, redirects authenticated users to /plans
 */

import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

interface RequireAuthProps {
  children: React.ReactNode;
}

/**
 * Wrapper component that requires authentication.
 * Redirects unauthenticated users to the home page (/).
 * Shows a loading spinner while auth state is resolving.
 */
export function RequireAuth({ children }: RequireAuthProps): React.ReactElement {
  const { user, loading } = useAuth();
  const location = useLocation();

  // Show loading state while auth is resolving
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-red"></div>
      </div>
    );
  }

  // Redirect to home if not authenticated
  if (!user) {
    // Save the attempted URL for potential redirect after login
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}

interface LandingRouteProps {
  publicComponent: React.ReactNode;
}

/**
 * Landing route component that shows different content based on auth state.
 * - Unauthenticated: Shows the public component (blogs)
 * - Authenticated: Redirects to /plans
 */
export function LandingRoute({ publicComponent }: LandingRouteProps): React.ReactElement {
  const { user, loading } = useAuth();

  // Show loading state while auth is resolving
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-red"></div>
      </div>
    );
  }

  // Authenticated users go to plans
  if (user) {
    return <Navigate to="/plans" replace />;
  }

  // Unauthenticated users see the public component
  return <>{publicComponent}</>;
}

export default RequireAuth;

