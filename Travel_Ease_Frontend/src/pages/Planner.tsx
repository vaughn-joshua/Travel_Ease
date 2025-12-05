import { useEffect, useState, useMemo, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { useTravelPlanDetail } from "../features/travelPlans/queries";
import { useUpdatePlan, useRequestJoin } from "../features/travelPlans/mutations";
import { useTravelSpots } from "../features/businesses/queries";
import Activities from "../components/dashboard/Activities";
import EditPlan from "../components/dashboard/EditPlan";
import CreateActivity from "../components/dashboard/CreateActivity";
import Collaborators from "../components/dashboard/Collaborators";
import React from "react";
import LandingPage from "./LandingPage";
import type { TravelPlanDates } from "../types/travelPlan";
import type { RouteInfo } from "../components/map/RoutingMachine";
import { useAuth } from "../context/AuthContext";
import { travelPlanKeys } from "../lib/queryKeys";

const itineraryRoute = {
  start: [14.1154, 120.9618] as [number, number],
};

type ModalType = "" | "activity" | "plan" | "collaborators";

interface ClickedActivity {
  start: [number, number] | null;
  end: [number, number] | null;
}

export default function Planner(): React.ReactElement {
  const { id, status } = useParams<{ id: string; status: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, loading: authLoading, session } = useAuth();

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
  if (authLoading || !tokenChecked || planLoading) {
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

  return (
    <div className="p-5">
      <div className="flex gap-6">
        <div className="w-9/12 h-[60vh] relative">
          <div id="map-container" className="card w-full h-full">
            <LandingPage
              start={itineraryRoute.start}
              end={clickedActivity.end}
              className="w-full h-full grid col-span-8"
              onRouteFound={handleRouteFound}
            />
          </div>
          {/* Plan title overlay - outside map container */}
          <div className="absolute top-4 left-4 bg-white border border-gray-200 rounded-lg px-4 py-2 shadow-lg z-[1000] pointer-events-none">
            <h3 className="font-semibold text-gray-900">{plan.title}</h3>
            <p className="text-xs text-gray-500">{plan.location}</p>
          </div>
          {/* ETA overlay - outside map container to avoid Leaflet re-render issues */}
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
        <div className="activities w-3/12">
          <div className="flex justify-between">
            <div className="flex gap-5">
              {Array.from({ length: days }, (_, i) => (
                <h3
                  className="font-bold cursor-pointer"
                  key={i}
                  onClick={() => click_day(i + 1)}
                >
                  Day {i + 1}
                </h3>
              ))}
            </div>
            <div>
              {status !== "join" && (
                <button
                  onClick={() => setActiveModal("activity")}
                  className="hard_btn"
                >
                  Add Activity
                </button>
              )}
            </div>
          </div>
          <div className="activities">
            {dates.start && id && (
              <Activities
                status={status}
                reference_id={id}
                load_state={loadActivity}
                day_selected={daySelected}
                dates={dates}
                onSendData={handleChildData}
              />
            )}
          </div>
        </div>
      </div>

      <div id="travel_plan_details_header" className="card mt-6">
        <div className="flex justify-between">
          <h1>{plan.title}</h1>

          <div id="buttons_container" className="space-x-2">
            {/* Draft + start: Start Now, Edit, Collaborators */}
            {/* Completed + start: Start Now, Edit, Collaborators */}
            {status === "start" && (plan?.status === "Draft" || plan?.status === "Completed") && (
              <>
                <button
                  className="hard_btn"
                  onClick={handle_start}
                  disabled={updatePlanMutation.isPending}
                >
                  {updatePlanMutation.isPending ? "Starting..." : "Start Now"}
                </button>
                <button
                  onClick={() => setActiveModal("plan")}
                  className="soft_btn"
                  disabled={updatePlanMutation.isPending}
                >
                  Edit
                </button>
                <button
                  className="soft_btn"
                  onClick={() => setActiveModal("collaborators")}
                >
                  Collaborators
                </button>
              </>
            )}

            {/* Join: Request to Join, Collaborators (any plan status) */}
            {status === "join" && (
              <>
                {joinSuccess ? (
                  <span className="px-4 py-2 bg-green-100 text-green-700 rounded-lg font-medium">
                    Request Sent!
                  </span>
                ) : (
                  <button
                    className="hard_btn"
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
                )}
                <button
                  className="soft_btn"
                  onClick={() => setActiveModal("collaborators")}
                >
                  Collaborators
                </button>
              </>
            )}

            {/* Active + view: Edit, Collaborators */}
            {status === "view" && plan?.status === "Active" && (
              <>
                <button
                  onClick={() => setActiveModal("plan")}
                  className="soft_btn"
                >
                  Edit
                </button>
                <button
                  className="soft_btn"
                  onClick={() => setActiveModal("collaborators")}
                >
                  Collaborators
                </button>
              </>
            )}

            {/* Draft + view: Start Now, Edit, Collaborators */}
            {status === "view" && plan?.status === "Draft" && (
              <>
                <button
                  className="hard_btn"
                  onClick={handle_start}
                  disabled={updatePlanMutation.isPending}
                >
                  {updatePlanMutation.isPending ? "Starting..." : "Start Now"}
                </button>
                <button
                  onClick={() => setActiveModal("plan")}
                  className="soft_btn"
                >
                  Edit
                </button>
                <button
                  className="soft_btn"
                  onClick={() => setActiveModal("collaborators")}
                >
                  Collaborators
                </button>
              </>
            )}

            {/* Completed + view: Start Now, Edit, Collaborators */}
            {status === "view" && plan?.status === "Completed" && (
              <>
                <button
                  className="hard_btn"
                  onClick={handle_start}
                  disabled={updatePlanMutation.isPending}
                >
                  {updatePlanMutation.isPending ? "Starting..." : "Start Now"}
                </button>
                <button
                  onClick={() => setActiveModal("plan")}
                  className="soft_btn"
                >
                  Edit
                </button>
                <button
                  className="soft_btn"
                  onClick={() => setActiveModal("collaborators")}
                >
                  Collaborators
                </button>
              </>
            )}
          </div>
        </div>

        <p>{plan.description}</p>
        <p>{plan.location}</p>
        <p>{plan.start_date}</p>
        <p>{plan.end_date}</p>
        <p>{plan.slots}</p>
      </div>

      {activeModal === "activity" && id && (
        <CreateActivity
          dates={dates}
          id={id}
          on_close={() => {
            setLoadActivity((prev) => !prev);
            setActiveModal("");
          }}
        />
      )}
      {activeModal === "plan" && id && plan && (
        <EditPlan data={[plan]} travel_plan={id} on_close={handle_close} />
      )}
      {activeModal === "collaborators" && id && (
        <Collaborators
          planId={id}
          isOwner={plan?.user_id === user?.id}
          on_close={() => setActiveModal("")}
        />
      )}
    </div>
  );
}
