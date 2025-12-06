import { useEffect, useState, useMemo, useCallback } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { useTravelPlanDetail, useUserPlanRole } from "../features/travelPlans/queries";
import { useUpdatePlan, useRequestJoin } from "../features/travelPlans/mutations";
import { useTravelSpots } from "../features/businesses/queries";
import Activities from "../components/dashboard/Activities";
import EditPlan from "../components/dashboard/EditPlan";
import CreateActivity from "../components/dashboard/CreateActivity";
import Collaborators from "../components/dashboard/Collaborators";
import SuggestedBusinesses from "../components/dashboard/SuggestedBusinesses";
import React from "react";
import LandingPage from "./LandingPage";
import type { TravelPlanDates } from "../types/travelPlan";
import type { RouteInfo } from "../components/map/RoutingMachine";
import type { SearchResult } from "../types/map";
import { useAuth } from "../context/AuthContext";
import { travelPlanKeys } from "../lib/queryKeys";

const itineraryRoute = {
  start: [14.1154, 120.9618] as [number, number],
};

type ModalType = "" | "activity" | "plan" | "collaborators";
type RightPanelTab = "activities" | "suggested";

interface ClickedActivity {
  start: [number, number] | null;
  end: [number, number] | null;
}

interface LocationState {
  prefillActivity?: SearchResult;
}

export default function Planner(): React.ReactElement {
  const { id, status } = useParams<{ id: string; status: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { user, loading: authLoading, session } = useAuth();
  
  // Right panel tab state
  const [activeRightTab, setActiveRightTab] = useState<RightPanelTab>("activities");
  
  // Get prefill data from navigation state (from Map page)
  const locationState = location.state as LocationState | null;
  const [prefillActivity, setPrefillActivity] = useState<SearchResult | null>(
    locationState?.prefillActivity || null
  );


  // Track token availability - re-check when auth loading changes or session changes
  const [tokenReady, setTokenReady] = useState(false);
  const [tokenChecked, setTokenChecked] = useState(false);

  useEffect(() => {
    // Only check for token AFTER auth loading is complete
    if (!authLoading) {
      // Small delay to ensure AuthContext has synced the token
      const checkToken = () => {
        const token = localStorage.getItem("token");
        const hasToken = !!token;

        // Debug logging
        console.log("Planner auth check:", {
          authLoading,
          hasToken,
          hasSession: !!session,
          hasUser: !!user,
          tokenLength: token?.length,
        });

        setTokenReady(hasToken);
        setTokenChecked(true);
      };

      // Give AuthContext a moment to sync the token
      const timeoutId = setTimeout(checkToken, 100);
      return () => clearTimeout(timeoutId);
    }
  }, [authLoading, session, user]);

  // Use TanStack Query for plan data - only enable when auth is ready and we have a token
  const {
    data: plan,
    isLoading: planLoading,
    error: planError,
    refetch: refetchPlan,
  } = useTravelPlanDetail(tokenReady && tokenChecked ? id : undefined);

  // Fetch user's role for this plan
  const { data: userRoleData, isLoading: roleLoading } = useUserPlanRole(
    tokenReady && tokenChecked && plan ? id : undefined
  );

  // Compute permissions based on role
  const permissions = useMemo(() => {
    const isOwner = userRoleData?.isOwner || plan?.user_id === user?.id;
    const role = userRoleData?.role;
    const isParticipant = userRoleData?.isParticipant || false;
    
    // Permission matrix:
    // - Owner/Admin/Editor: can add/edit activities, edit plan, edit roles
    // - Owner/Admin: can delete collaborators
    // - Owner/Admin/Editor/Viewer: can invite collaborators, start plan (if not active)
    // - Non-participant: can only view and request to join
    
    const canEdit = isOwner || role === "Admin" || role === "Editor";
    const canDelete = isOwner || role === "Admin";
    const canStart = isOwner || isParticipant; // All participants can start
    const canInvite = isOwner || role === "Admin" || role === "Editor" || role === "Viewer";
    const isNonParticipant = !isOwner && !isParticipant;
    
    return {
      isOwner,
      role,
      isParticipant,
      canEdit,
      canDelete,
      canStart,
      canInvite,
      isNonParticipant,
    };
  }, [userRoleData, plan?.user_id, user?.id]);

  const [days, setDays] = useState<number>(0);
  const [loadActivity, setLoadActivity] = useState<boolean>(false);
  const [daySelected, setDaySelected] = useState<number>(1);
  const [activeModal, setActiveModal] = useState<ModalType>("");

  // Use TanStack Query for businesses (travel spots)
  const { data: travelSpotsData } = useTravelSpots();
  const businesses = travelSpotsData?.data;

  const [dates, setDates] = useState<TravelPlanDates>({
    start: "",
    end: "",
  });

  const [clickedActivity, setClickActivity] = useState<ClickedActivity>({
    start: null,
    end: null,
  });

  const [routeInfo, setRouteInfo] = useState<RouteInfo | null>(null);

  // Callback for when route is found
  const handleRouteFound = useCallback((info: RouteInfo) => {
    if (info.distance > 0 && info.time > 0) {
      setRouteInfo(info);
    } else {
      setRouteInfo(null);
    }
  }, []);

  const handle_close = (): void => {
    // Invalidate and refetch instead of full page reload
    queryClient.invalidateQueries({
      queryKey: travelPlanKeys.detail(id ?? ""),
    });
    setActiveModal("");
  };

  const handleChildData = (lat: number, long: number): void => {
    console.log({ lat, long });
    setClickActivity({ start: null, end: [lat, long] });
  };

  // Handler when a business is selected from suggested tab
  const handleBusinessSelect = (business: { lat?: number; lng?: number; longitude?: number }) => {
    const lat = business.lat;
    const lng = business.lng || business.longitude;
    if (lat && lng) {
      setClickActivity({ start: null, end: [lat, lng] });
    }
  };

  // Handler to add business as activity
  const handleAddBusinessToActivity = (business: SearchResult) => {
    setPrefillActivity(business);
    setActiveModal("activity");
    setActiveRightTab("activities");
  };

  // Refetch plan when modal closes (for edit updates)
  useEffect(() => {
    if (activeModal === "" && id) {
      refetchPlan();
    }
  }, [activeModal, id, refetchPlan]);

  // Calculate days and dates from plan
  const { calculatedDays, calculatedDates } = useMemo(() => {
    if (!plan?.start_date || !plan?.end_date) {
      return { calculatedDays: 1, calculatedDates: { start: "", end: "" } };
    }

    const start = new Date(plan.start_date);
    const end = new Date(plan.end_date);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      console.warn("Invalid date values:", plan.start_date, plan.end_date);
      return { calculatedDays: 1, calculatedDates: { start: "", end: "" } };
    }

    const diff = end.getTime() - start.getTime();
    const dayCount = Math.ceil(diff / (1000 * 60 * 60 * 24)) + 1;

    return {
      calculatedDays: dayCount,
      calculatedDates: { start: start.toISOString(), end: end.toISOString() },
    };
  }, [plan?.start_date, plan?.end_date]);

  useEffect(() => {
    setDays(calculatedDays);
    setDates(calculatedDates);
  }, [calculatedDays, calculatedDates]);

  // Redirect from /start to /view if plan is already Active
  useEffect(() => {
    if (status === "start" && plan?.status === "Active" && id) {
      navigate(`/planner/view/${id}`, { replace: true });
    }
  }, [status, plan?.status, id, navigate]);

  // Auto-open activity modal if coming from Map page with prefill data
  useEffect(() => {
    if (prefillActivity && plan && dates.start && permissions.canEdit) {
      setActiveModal("activity");
      // Clear the location state to prevent re-opening on refresh
      window.history.replaceState({}, document.title);
    }
  }, [prefillActivity, plan, dates.start, permissions.canEdit]);


  const click_day = (i: number): void => {
    setLoadActivity((prev) => !prev);
    setDaySelected(i);
  };

  // Use TanStack Query mutation for updating plan status
  const updatePlanMutation = useUpdatePlan();


  // Use TanStack Query mutation for requesting to join
  const requestJoinMutation = useRequestJoin();
  const [joinSuccess, setJoinSuccess] = useState(false);

  const handle_start = (): void => {
    if (!id) return;

    // Update the plan status from Draft to Active
    updatePlanMutation.mutate(
      { id, data: { status: "Active" } },
      {
        onSuccess: () => {
          // Navigate to view mode after successfully starting the plan
          navigate(`/planner/view/${id}`);
        },
        onError: (error) => {
          console.error("Error starting plan:", error);
          alert("Failed to start the plan. Please try again.");
        },
      }
    );
  };

  // Show loading state - wait for auth to complete and token to be checked
  if (authLoading || !tokenChecked || planLoading || roleLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600">
            {authLoading
              ? "Checking authentication..."
              : !tokenChecked
              ? "Verifying session..."
              : "Loading plan..."}
          </p>
        </div>
      </div>
    );
  }

  // Show error if no token after auth completes
  if (!tokenReady && tokenChecked) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <p className="text-red-600 mb-4">Authentication required</p>
          <p className="text-gray-500 text-sm mb-4">
            Please log in to view this plan.
          </p>
          <button onClick={() => navigate("/login")} className="hard_btn">
            Log In
          </button>
        </div>
      </div>
    );
  }

  // Show error state
  if (planError) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <p className="text-red-600 mb-4">Failed to load plan</p>
          <p className="text-gray-500 text-sm mb-4">{planError.message}</p>
          <button onClick={() => refetchPlan()} className="hard_btn">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <p className="text-gray-600">Plan not found</p>
          <button onClick={() => navigate("/plans")} className="soft_btn mt-4">
            Back to Plans
          </button>
        </div>
      </div>
    );
  }

  // Determine which buttons to show based on permissions
  const showAddActivity = permissions.canEdit && status !== "join";
  const showEditPlan = permissions.canEdit;
  const showStartNow = permissions.canStart && (plan?.status === "Draft" || plan?.status === "Completed");
  const showRequestJoin = permissions.isNonParticipant && status === "join";

  return (
    <div className="h-screen flex flex-col">
      {/* Main Content - Flex Row */}
      <div className="flex-1 flex gap-4 p-4 overflow-hidden">
        {/* LEFT COLUMN - Map + Plan Details */}
        <div className="flex-[2] flex flex-col gap-4 min-w-0">
          {/* Map Container */}
          <div className="flex-1 relative rounded-xl overflow-hidden shadow-lg border border-gray-200">
            <div id="map-container" className="w-full h-full">
            <LandingPage
              start={itineraryRoute.start}
              end={clickedActivity.end}
                className="w-full h-full"
              onRouteFound={handleRouteFound}
            />
          </div>
            {/* Plan title overlay */}
          <div className="absolute top-4 left-4 bg-white border border-gray-200 rounded-lg px-4 py-2 shadow-lg z-[1000] pointer-events-none">
            <h3 className="font-semibold text-gray-900">{plan.title}</h3>
            <p className="text-xs text-gray-500">{plan.location}</p>
          </div>
            {/* ETA overlay */}
          {routeInfo && clickedActivity.end && (
            <div className="absolute bottom-4 left-4 bg-white border border-gray-200 rounded-lg px-4 py-3 shadow-lg z-[1000] pointer-events-none">
              <p className="text-xs text-gray-500 mb-1">Estimated Travel</p>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1">
                  <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="font-semibold text-gray-900">{routeInfo.time} min</span>
                </div>
                <div className="flex items-center gap-1">
                  <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span className="font-semibold text-gray-900">{routeInfo.distance} km</span>
                </div>
              </div>
            </div>
          )}
        </div>

          {/* Plan Details Card */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-4">
            <div className="flex justify-between items-start mb-3">
            <div>
                <h1 className="text-xl font-bold text-gray-900">{plan.title}</h1>
                <p className="text-gray-500 text-sm">{plan.location}</p>
            </div>
              <div className="flex gap-2">
                {showStartNow && (
                <button
                    className="hard_btn text-sm"
                  onClick={handle_start}
                  disabled={updatePlanMutation.isPending}
                >
                  {updatePlanMutation.isPending ? "Starting..." : "Start Now"}
                </button>
                )}
                {showEditPlan && (
                <button
                  onClick={() => setActiveModal("plan")}
                    className="soft_btn text-sm"
                  disabled={updatePlanMutation.isPending}
                >
                  Edit
                </button>
                )}
                {showRequestJoin && (
                  joinSuccess ? (
                    <span className="px-3 py-1.5 bg-green-100 text-green-700 rounded-lg text-sm font-medium">
                    Request Sent!
                  </span>
                ) : (
                  <button
                      className="hard_btn text-sm"
                    onClick={() =>
                      requestJoinMutation.mutate(
                        { travel_plan_id: Number(id) },
                        {
                          onSuccess: () => setJoinSuccess(true),
                          onError: (error) => {
                            console.error("Join request error:", error);
                            alert("Failed to send join request. Please try again.");
                          },
                        }
                      )
                    }
                    disabled={requestJoinMutation.isPending}
                  >
                    {requestJoinMutation.isPending ? "Sending..." : "Request to Join"}
                  </button>
                  )
                )}
                <button
                  className="soft_btn text-sm"
                  onClick={() => setActiveModal("collaborators")}
                >
                  Collaborators
                </button>
              </div>
            </div>
            <p className="text-gray-600 text-sm mb-2">{plan.description}</p>
            {/* Plan Details Below Border Line */}
            <div className="pt-2 border-t border-gray-200 space-y-1.5">
              <div className="flex items-center gap-2 text-xs text-gray-600">
                <span className="font-medium">Date:</span>
                <span className="text-gray-500">📅 {plan.start_date} - {plan.end_date}</span>
              </div>
              {plan.slots && (
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <span className="font-medium">Slots:</span>
                  <span className="text-gray-500">👥 {plan.slots} slots</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-xs text-gray-600">
                <span className="font-medium">Accommodation:</span>
                {plan.accommodation ? (
                  <span className="text-gray-700">🛏️ {plan.accommodation.name}</span>
                ) : (
                  <span className="text-gray-400 italic">No accommodation set</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN - Tabbed Panel (Activities / Suggested) */}
        <div className="w-96 flex flex-col bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          {/* Tab Navigation */}
          <div className="flex border-b border-gray-200">
                <button
              onClick={() => setActiveRightTab("activities")}
              className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
                activeRightTab === "activities"
                  ? "text-red-600 border-b-2 border-red-600 bg-red-50/50"
                  : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
              }`}
            >
              Activities
                </button>
                <button
              onClick={() => setActiveRightTab("suggested")}
              className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
                activeRightTab === "suggested"
                  ? "text-red-600 border-b-2 border-red-600 bg-red-50/50"
                  : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
              }`}
            >
              Suggested
                </button>
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-y-auto">
            {activeRightTab === "activities" && (
              <div className="p-4">
                {/* Day Selector */}
                <div className="flex justify-between items-center mb-4">
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    {Array.from({ length: days }, (_, i) => (
                <button
                        key={i}
                        onClick={() => click_day(i + 1)}
                        className={`px-3 py-1.5 text-sm font-medium rounded-full whitespace-nowrap transition-colors ${
                          daySelected === i + 1
                            ? "bg-red-600 text-white"
                            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                        }`}
                      >
                        Day {i + 1}
                </button>
                    ))}
                  </div>
                  {showAddActivity && (
                <button
                      onClick={() => setActiveModal("activity")}
                      className="hard_btn text-sm whitespace-nowrap ml-2"
                >
                      + Add
                </button>
                  )}
                </div>

                {/* Activities List */}
                {dates.start && id && (
                  <Activities
                    status={status}
                    reference_id={id}
                    load_state={loadActivity}
                    day_selected={daySelected}
                    dates={dates}
                    canEdit={permissions.canEdit}
                    onSendData={handleChildData}
                  />
                )}
              </div>
            )}

            {activeRightTab === "suggested" && (
              <SuggestedBusinesses
                planId={id!}
                dates={dates}
                canEdit={permissions.canEdit}
                onBusinessSelect={handleBusinessSelect}
                onAddToActivity={handleAddBusinessToActivity}
              />
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      {activeModal === "activity" && id && permissions.canEdit && (
        <CreateActivity
          dates={dates}
          id={id}
          initialLocation={prefillActivity || undefined}
          on_close={() => {
            setLoadActivity((prev) => !prev);
            setActiveModal("");
            setPrefillActivity(null); // Clear prefill after closing
          }}
        />
      )}
      {activeModal === "plan" && id && plan && permissions.canEdit && (
        <EditPlan data={[plan]} travel_plan={id} on_close={handle_close} />
      )}
      {activeModal === "collaborators" && id && (
        <Collaborators
          planId={id}
          userRole={permissions.isOwner ? "owner" : (permissions.role || null)}
          canDelete={permissions.canDelete}
          canInvite={permissions.canInvite}
          canEditRoles={permissions.canEdit}
          on_close={() => setActiveModal("")}
        />
      )}

    </div>
  );
}
