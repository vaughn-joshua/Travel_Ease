/**
 * BusinessOnboarding
 *
 * Entry point for the "Create Business" flow.
 * - Wrapped in RequireAuth to ensure user is authenticated (Google or password).
 * - Renders the BusinessForm once authenticated.
 */

import { RequireAuth } from "../routes/AuthRoutes";
import BusinessForm from "./BusinessForm";

export default function BusinessOnboarding() {
  return (
    <RequireAuth>
      <BusinessForm />
    </RequireAuth>
  );
}

