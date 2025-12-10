import { useState, useEffect, useCallback, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import CreatePlan from "../components/dashboard/CreatePlan";
import UpcomingPlans from "../components/dashboard/UpcomingPlans";
import OngoingPlans from "../components/dashboard/OngoingPlans";
import PreviousPlans from "../components/dashboard/PreviousPlans";
import PublicPlans from "../components/dashboard/PublicPlans";
import QuickJoin from "../components/dashboard/QuickJoin";
import PlanModal from "../components/dashboard/PlanModal";
import PageContainer from "../components/ui/PageContainer";
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
  "Preparing your travel dashboard...",
  "Loading your adventures...",
  "Getting everything ready...",
  "Almost there...",
];

// Loading timeout in milliseconds (10 seconds)
const LOADING_TIMEOUT_MS = 10000;
// Message rotation interval (2.5 seconds)
const MESSAGE_INTERVAL_MS = 2500;

export default function MainPage(): React.ReactElement {
  const queryClient = useQueryClient();
  const { user, loading: authLoading } = useAuth();

  const isAuthenticated = !authLoading && Boolean(user);

  // Use TanStack Query hooks to track loading states
  const { isLoading: ongoingLoading, isFetched: ongoingFetched } = useOngoingPlans(isAuthenticated);
  const { isLoading: upcomingLoading, isFetched: upcomingFetched } = useUpcomingPlans(isAuthenticated);
  const { isLoading: previousLoading, isFetched: previousFetched } = usePreviousPlans(isAuthenticated);
  const { isLoading: publicLoading, isFetched: publicFetched } = usePublicPlans();

  // Combined loading state
  const isAnyLoading = useMemo(() => {
    if (authLoading) return true;
    if (!isAuthenticated) return publicLoading;
    return ongoingLoading || upcomingLoading || previousLoading || publicLoading;
  }, [authLoading, isAuthenticated, ongoingLoading, upcomingLoading, previousLoading, publicLoading]);

  const allFetched = useMemo(() => {
    if (!isAuthenticated) return publicFetched;
    return ongoingFetched && upcomingFetched && previousFetched && publicFetched;
  }, [isAuthenticated, ongoingFetched, upcomingFetched, previousFetched, publicFetched]);

  const [messageIndex, setMessageIndex] = useState(0);
  const [forceShowContent, setForceShowContent] = useState(false);

  useEffect(() => {
    setForceShowContent(false);
    setMessageIndex(0);
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAnyLoading && allFetched) return;
    if (forceShowContent) return;

    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % LOADING_MESSAGES.length);
    }, MESSAGE_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [isAnyLoading, allFetched, forceShowContent]);

  useEffect(() => {
    if (forceShowContent) return;
    if (!isAnyLoading && allFetched) return;

    const timeout = setTimeout(() => {
      setForceShowContent(true);
    }, LOADING_TIMEOUT_MS);

    return () => clearTimeout(timeout);
  }, [isAnyLoading, allFetched, forceShowContent]);
  
  const [activeModal, setActiveModal] = useState<ModalType>("");
  const [results, setResults] = useState<TravelPlan[]>([]);

  const handle_close = useCallback((): void => {
    queryClient.invalidateQueries({ queryKey: travelPlanKeys.all });
    setActiveModal("");
  }, [queryClient]);

  const showLoadingOverlay = isAnyLoading && !allFetched && !forceShowContent;

  // Loading state with improved design
  if (showLoadingOverlay) {
    return (
      <div className="bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="text-center px-4">
          {/* Animated logo/spinner */}
          <div className="relative w-16 h-16 mx-auto mb-6">
            <div className="absolute inset-0 rounded-full border-4 border-gray-200" />
            <div className="absolute inset-0 rounded-full border-4 border-primary-red border-t-transparent animate-spin" />
            <div className="absolute inset-3 rounded-full bg-primary-red/10 flex items-center justify-center">
              <svg className="w-6 h-6 text-primary-red" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
            </div>
          </div>
          <p className="text-lg text-gray-700 font-medium mb-2">
            {LOADING_MESSAGES[messageIndex]}
          </p>
          <p className="text-sm text-gray-400">
            This usually takes just a moment
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <PageContainer>
        {/* Header section */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                {user ? `Welcome back, ${user.firstName || "Traveler"}` : "Travel Plans"}
              </h1>
              <p className="text-gray-500 mt-1">
                {user ? "Manage your adventures and discover new destinations" : "Discover and join travel plans"}
              </p>
            </div>
            {isAuthenticated && (
              <button
                onClick={() => setActiveModal("create")}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-red text-white rounded-xl font-medium hover:bg-primary-red-dark transition-all shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary-red focus:ring-offset-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Create Plan
              </button>
            )}
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
          {/* LEFT COLUMN - Main content */}
          <div className="w-full lg:flex-[2] min-w-0 space-y-8">
            {/* Ongoing Plans Section */}
            {isAuthenticated && (
              <section>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-2 h-6 bg-emerald-500 rounded-full" />
                  <h2 className="text-xl font-semibold text-gray-900">Ongoing Plans</h2>
                </div>
                <OngoingPlans />
              </section>
            )}

            {/* Upcoming Plans Section */}
            {isAuthenticated && (
              <section>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-2 h-6 bg-indigo-500 rounded-full" />
                  <h2 className="text-xl font-semibold text-gray-900">Upcoming Plans</h2>
                </div>
                <UpcomingPlans />
              </section>
            )}
          </div>

          {/* RIGHT COLUMN - Sidebar */}
          <div className="w-full lg:w-80 xl:w-96 min-w-0 space-y-6">
            {/* Public Plans Section */}
            <section className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-primary-red" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <h2 className="font-semibold text-gray-900">Discover Plans</h2>
                  </div>
                  <button
                    onClick={() => setActiveModal("join")}
                    className="text-xs font-medium text-primary-red hover:text-primary-red-dark transition-colors flex items-center gap-1"
                  >
                    Quick Join
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">Join community travel plans</p>
              </div>
              <div className="p-4">
                <PublicPlans />
              </div>
            </section>

            {/* Previous Plans Section - Only for authenticated users */}
            {isAuthenticated && (
              <section className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100">
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <h2 className="font-semibold text-gray-900">Past Adventures</h2>
                  </div>
                </div>
                <div className="p-4">
                  <PreviousPlans />
                </div>
              </section>
            )}
          </div>
        </div>
      </PageContainer>

      {/* Modals */}
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

      {activeModal === "create" && <CreatePlan on_close={handle_close} />}

      {activeModal === "quick" && (
        <PlanModal results={results} on_close={() => setActiveModal("")} />
      )}
    </div>
  );
}
