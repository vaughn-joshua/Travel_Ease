import { useState, useEffect, useCallback, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import CreatePlan from "../components/dashboard/CreatePlan";
import UpcomingPlans from "../components/dashboard/UpcomingPlans";
import OngoingPlans from "../components/dashboard/OngoingPlans";
import PreviousPlans from "../components/dashboard/PreviousPlans";
import PublicPlans from "../components/dashboard/PublicPlans";
import QuickJoin from "../components/dashboard/QuickJoin";
import PlanModal from "../components/dashboard/PlanModal";
import type { TravelPlan } from "../types/travelPlan";
import { travelPlanKeys } from "../lib/queryKeys";
import { useAuth } from "../context/AuthContext";
import {
  useOngoingPlans,
  useUpcomingPlans,
  usePreviousPlans,
  usePublicPlans,
} from "../features/travelPlans/queries";

type ModalType = "" | "create" | "join" | "quick";

// Rotating loading messages
const LOADING_MESSAGES = [
  "Fetching your ideal plans...",
  "Prepare to plan your dream trip!",
  "Loading your adventures...",
  "Getting everything ready for you...",
  "Almost there, gathering your plans...",
  "Curating your travel experiences...",
];

// Loading timeout in milliseconds (10 seconds)
const LOADING_TIMEOUT_MS = 10000;
// Message rotation interval (2.5 seconds)
const MESSAGE_INTERVAL_MS = 2500;

export default function MainPage(): React.ReactElement {
  const queryClient = useQueryClient();
  const { loading: authLoading } = useAuth();

  // Check for token in localStorage to determine if user is authenticated
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const isAuthenticated = !authLoading && Boolean(token);

  // Use TanStack Query hooks to track loading states (data will be cached for children)
  const { isLoading: ongoingLoading, isFetched: ongoingFetched } = useOngoingPlans(isAuthenticated);
  const { isLoading: upcomingLoading, isFetched: upcomingFetched } = useUpcomingPlans(isAuthenticated);
  const { isLoading: previousLoading, isFetched: previousFetched } = usePreviousPlans(isAuthenticated);
  const { isLoading: publicLoading, isFetched: publicFetched } = usePublicPlans();

  // Combined loading state - loading until all queries have completed or we're not authenticated
  const isAnyLoading = useMemo(() => {
    if (authLoading) return true;
    
    // If not authenticated, only wait for public plans
    if (!isAuthenticated) {
      return publicLoading;
    }
    
    // If authenticated, wait for all plans
    return ongoingLoading || upcomingLoading || previousLoading || publicLoading;
  }, [authLoading, isAuthenticated, ongoingLoading, upcomingLoading, previousLoading, publicLoading]);

  // Check if all data has been fetched at least once
  const allFetched = useMemo(() => {
    if (!isAuthenticated) {
      return publicFetched;
    }
    return ongoingFetched && upcomingFetched && previousFetched && publicFetched;
  }, [isAuthenticated, ongoingFetched, upcomingFetched, previousFetched, publicFetched]);

  // State for rotating loading message
  const [messageIndex, setMessageIndex] = useState(0);
  // State for timeout - force show content after timeout
  const [forceShowContent, setForceShowContent] = useState(false);

  // Rotate loading messages during loading
  useEffect(() => {
    if (!isAnyLoading && allFetched) return;
    if (forceShowContent) return;

    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % LOADING_MESSAGES.length);
    }, MESSAGE_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [isAnyLoading, allFetched, forceShowContent]);

  // Timeout mechanism - force show content after LOADING_TIMEOUT_MS
  useEffect(() => {
    if (forceShowContent) return;
    if (!isAnyLoading && allFetched) return;

    const timeout = setTimeout(() => {
      setForceShowContent(true);
    }, LOADING_TIMEOUT_MS);

    return () => clearTimeout(timeout);
  }, [isAnyLoading, allFetched, forceShowContent]);

  // Tracks which modal is currently open
  const [activeModal, setActiveModal] = useState<ModalType>("");

  // Stores results returned from Quick Join
  const [results, setResults] = useState<TravelPlan[]>([]);

  // Closes modal - no reload needed, TanStack Query handles cache invalidation
  const handle_close = useCallback((): void => {
    // Invalidate plan queries to refetch fresh data
    queryClient.invalidateQueries({ queryKey: travelPlanKeys.all });
    setActiveModal("");
  }, [queryClient]);

  // Determine if we should show the loading overlay
  // Show loading if: still loading AND (not all fetched OR timeout hasn't occurred)
  const showLoadingOverlay = isAnyLoading && !allFetched && !forceShowContent;

  // Show loading overlay
  if (showLoadingOverlay) {
    return (
      <div className="bg-gray-50 w-full min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-6 h-12 w-12 animate-spin rounded-full border-4 border-gray-200 border-t-primary-red" />
          <p className="text-lg text-gray-600 font-medium animate-pulse">
            {LOADING_MESSAGES[messageIndex]}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 w-full min-h-screen p-5">
      <div className="flex flex-col lg:flex-row gap-6">
        {/* LEFT COLUMN (Ongoing + Upcoming) */}
        <div className="flex-[3] min-w-0">
          <div id="ongoing_plans">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-2xl font-semibold text-gray-900">
                Ongoing Plans
              </h3>
              <button
                onClick={() => setActiveModal("create")}
                className="hard_btn"
              >
                + Create Plan
              </button>
            </div>
            <OngoingPlans />
          </div>

          <div className="mt-6">
            <UpcomingPlans />
          </div>
        </div>

        {/* RIGHT COLUMN (Suggested + Previous) */}
        <div className="flex-1 min-w-0">
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-2xl font-semibold text-gray-900">
                Suggested Plans
              </h3>
              <button
                onClick={() => setActiveModal("join")}
                className="hard_btn"
              >
                Quick Join
              </button>
            </div>
            <PublicPlans />
          </div>

          <div className="mt-6">
            <PreviousPlans />
          </div>
        </div>
      </div>

      {/* MODAL: Quick Join */}
      {activeModal === "join" && (
        <QuickJoin
          on_close={(result: TravelPlan[]) => {
            setActiveModal("quick");
            if (result.length > 0) {
              setResults(result);
            } else {
              setActiveModal("");
            }
          }}
        />
      )}

      {/* MODAL: Create Plan */}
      {activeModal === "create" && <CreatePlan on_close={handle_close} />}

      {/* MODAL: Plan Details for Quick Join Results */}
      {activeModal === "quick" && (
        <PlanModal results={results} on_close={() => setActiveModal("")} />
      )}
    </div>
  );
}
