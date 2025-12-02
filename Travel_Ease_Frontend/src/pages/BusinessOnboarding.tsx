/**
 * BusinessOnboarding
 *
 * Entry point for the "Create Business" flow.
 * - Wrapped in RequireSupabaseAuth to ensure user is signed in via Google.
 * - Renders the BusinessForm once authenticated.
 */

import { RequireSupabaseAuth } from "../routes/AuthRoutes";
import BusinessForm from "./BusinessForm";

export default function BusinessOnboarding() {
  return (
    <RequireSupabaseAuth fallbackPath="/businesses">
      <BusinessForm />
    </RequireSupabaseAuth>
  );
}

