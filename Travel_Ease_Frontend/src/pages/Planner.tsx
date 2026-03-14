import { useEffect, useState, useMemo, useCallback, useRef } from "react";
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
import LandingPage, { type MapMarker } from "./LandingPage";
import type { TravelPlanDates } from "../types/travelPlan";
import type { RouteInfo } from "../components/map/RoutingMachine";
import type { SearchResult } from "../types/map";
import { useAuth } from "../context/AuthContext";
import { travelPlanKeys } from "../lib/queryKeys";
import { useTravelPlanActivities } from "../features/travelPlans/queries";
import { StatusBadge, SlotsPill } from "../components/ui/PlanCard";
import { formatPlanDateRange } from "../utils/date";
import { WeatherWidget } from "../components/blog/Weather/Weather";

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
  
  const [activeRightTab, setActiveRightTab] = useState<RightPanelTab>("activities");
  const [dayScrollFade, setDayScrollFade] = useState({ left: false, right: true });
  const dayScrollRef = useRef<HTMLDivElement>(null);

  // Handle day selector scroll for gradient fades
  const handleDayScroll = useCallback(() => {
    const el = dayScrollRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setDayScrollFade({
      left: scrollLeft > 4,
      right: scrollLeft < scrollWidth - clientWidth - 4,
    });
  }, []);
  
  const locationState = location.state as LocationState | null;
  const [prefillActivity, setPrefillActivity] = useState<SearchResult | null>(
    locationState?.prefillActivity || null
  );

  const [tokenReady, setTokenReady] = useState(false);
  const [tokenChecked, setTokenChecked] = useState(false);

  useEffect(() => {
    if (!authLoading) {
      const checkToken = () => {
        const token = localStorage.getItem("token");
        const hasToken = !!token;
        setTokenReady(hasToken);
        setTokenChecked(true);
      };
      const timeoutId = setTimeout(checkToken, 100);
      return () => clearTimeout(timeoutId);
    }
  }, [authLoading, session, user]);

  const {
    data: plan,
    isLoading: planLoading,
    error: planError,
    refetch: refetchPlan,
  } = useTravelPlanDetail(tokenReady && tokenChecked ? id : undefined);

  const { data: userRoleData, isLoading: roleLoading } = useUserPlanRole(
    tokenReady && tokenChecked && plan ? id : undefined
  );

  const permissions = useMemo(() => {
    const isOwner = userRoleData?.isOwner || plan?.user_id === user?.id;
    const role = userRoleData?.role;
    const isParticipant = userRoleData?.isParticipant || false;
    
    const canEdit = isOwner || role === "Admin" || role === "Editor";
    const canDelete = isOwner || role === "Admin";
    const canStart = isOwner || isParticipant;
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

  const { data: allActivities = [] } = useTravelPlanActivities(id);

  const handleRouteFound = useCallback((info: RouteInfo) => {
    if (info.distance > 0 && info.time > 0) {
      setRouteInfo(info);
    } else {
      setRouteInfo(null);
    }
  }, []);

  const activitiesForDay = useMemo(() => {
    if (!allActivities.length || !dates.start) return [];

    const starting_date = new Date(dates.start);
    let current_day: Date;

    if (daySelected === 1) {
      current_day = starting_date;
    } else {
      const selected_day_ms = 1000 * 60 * 60 * 24 * (daySelected - 1);
      current_day = new Date(starting_date.getTime() + selected_day_ms);
    }

    return allActivities.filter((item) => {
      if (!item.target_date) return false;
      const activity_date = new Date(item.target_date);
      return activity_date.toDateString() === current_day.toDateString();
    });
  }, [allActivities, dates.start, daySelected]);

  const mapMarkers = useMemo((): MapMarker[] => {
    const markers: MapMarker[] = [];

    activitiesForDay.forEach((activity) => {
      if (activity.lat && activity.lng) {
        markers.push({
          position: [activity.lat, activity.lng],
          type: activity.is_priority ? 'priority' : 'activity',
          name: activity.name || activity.location || undefined,
        });
      }
    });

    if (plan?.accommodation?.lat && plan?.accommodation?.lng) {
      markers.push({
        position: [plan.accommodation.lat, plan.accommodation.lng],
        type: 'accommodation',
        name: plan.accommodation.name,
      });
    }

    return markers;
  }, [activitiesForDay, plan?.accommodation]);

  const handle_close = (): void => {
    queryClient.invalidateQueries({
      queryKey: travelPlanKeys.detail(id ?? ""),
    });
    setActiveModal("");
  };

  const handleChildData = (lat: number, long: number): void => {
    setClickActivity({ start: null, end: [lat, long] });
  };

  const handleBusinessSelect = (business: { lat?: number; lng?: number; longitude?: number }) => {
    const lat = business.lat;
    const lng = business.lng || business.longitude;
    if (lat && lng) {
      setClickActivity({ start: null, end: [lat, lng] });
    }
  };

  const handleAddBusinessToActivity = (business: SearchResult) => {
    setPrefillActivity(business);
    setActiveModal("activity");
    setActiveRightTab("activities");
  };

  useEffect(() => {
    if (activeModal === "" && id) {
      refetchPlan();
    }
  }, [activeModal, id, refetchPlan]);

  const { calculatedDays, calculatedDates } = useMemo(() => {
    if (!plan?.start_date || !plan?.end_date) {
      return { calculatedDays: 1, calculatedDates: { start: "", end: "" } };
    }

    const start = new Date(plan.start_date);
    const end = new Date(plan.end_date);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
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

  useEffect(() => {
    if (status === "start" && plan?.status === "Active" && id) {
      navigate(`/planner/view/${id}`, { replace: true });
    }
  }, [status, plan?.status, id, navigate]);

  useEffect(() => {
    if (prefillActivity && plan && dates.start && permissions.canEdit) {
      setActiveModal("activity");
      window.history.replaceState({}, document.title);
    }
  }, [prefillActivity, plan, dates.start, permissions.canEdit]);

  const click_day = (i: number): void => {
    setLoadActivity((prev) => !prev);
    setDaySelected(i);
  };

  const updatePlanMutation = useUpdatePlan();
  const requestJoinMutation = useRequestJoin();
  const [joinSuccess, setJoinSuccess] = useState(false);

  const handle_start = (): void => {
    if (!id) return;

    updatePlanMutation.mutate(
      { id, data: { status: "Active" } },
      {
        onSuccess: () => {
          navigate(`/planner/view/${id}`);
        },
        onError: (error) => {
          console.error("Error starting plan:", error);
          alert("Failed to start the plan. Please try again.");
        },
      }
    );
  };

  // Loading state
  if (authLoading || !tokenChecked || planLoading || roleLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-6">
            <div className="absolute inset-0 rounded-full border-4 border-gray-200" />
            <div className="absolute inset-0 rounded-full border-4 border-primary-red border-t-transparent animate-spin" />
          </div>
          <p className="text-gray-600 font-medium">
            {authLoading ? "Checking authentication..." : !tokenChecked ? "Verifying session..." : "Loading plan..."}
          </p>
        </div>
      </div>
    );
  }

  // No token error
  if (!tokenReady && tokenChecked) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Authentication Required</h2>
          <p className="text-gray-500 mb-6">Please log in to view this travel plan.</p>
          <button 
            onClick={() => navigate("/login")} 
            className="px-6 py-2.5 bg-primary-red text-white rounded-xl font-medium hover:bg-primary-red-dark transition-colors"
          >
            Log In
          </button>
        </div>
      </div>
    );
  }

  // Error state
  if (planError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Failed to Load Plan</h2>
          <p className="text-gray-500 mb-6">{planError.message}</p>
          <button 
            onClick={() => refetchPlan()} 
            className="px-6 py-2.5 bg-primary-red text-white rounded-xl font-medium hover:bg-primary-red-dark transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Plan Not Found</h2>
          <p className="text-gray-500 mb-6">This plan may have been deleted or you don't have access.</p>
          <button 
            onClick={() => navigate("/plans")} 
            className="px-6 py-2.5 border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
          >
            Back to Plans
          </button>
        </div>
      </div>
    );
  }

  const showAddActivity = permissions.canEdit && status !== "join";
  const showEditPlan = permissions.canEdit;
  const showStartNow = permissions.canStart && plan?.status === "Draft";
  const showRequestJoin = permissions.isNonParticipant && status === "join";

  return (
    <div className="h-screen flex flex-col bg-gray-100">
      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:flex-row gap-4 p-4 overflow-hidden">
        {/* LEFT COLUMN - Map + Plan Details */}
        <div className="flex-1 lg:flex-[2] flex flex-col gap-4 min-w-0 min-h-[50vh] lg:min-h-0">
          {/* Map Container */}
          <div className="flex-1 relative rounded-2xl overflow-hidden shadow-lg border border-gray-200 min-h-[300px] bg-gray-200">
            <LandingPage
              start={itineraryRoute.start}
              end={clickedActivity.end}
              markers={mapMarkers}
              className="w-full h-full"
              onRouteFound={handleRouteFound}
            />
            
            {/* Plan title overlay */}
            <div className="absolute top-4 left-4 right-4 sm:right-auto sm:max-w-[70%] rounded-xl bg-white/95 backdrop-blur-sm border border-gray-200/50 px-4 py-3 shadow-lg z-[1000] pointer-events-none">
              <div className="flex items-center gap-2 mb-1">
                <span className={`w-2 h-2 rounded-full ${plan.status === "Active" ? "bg-emerald-500" : "bg-gray-400"}`} />
                <span className="text-xs font-medium text-gray-500">{plan.status}</span>
              </div>
              <h3 className="font-bold text-gray-900">{plan.title}</h3>
              <p className="text-xs text-gray-500 mt-0.5">{plan.location}</p>
            </div>
            
            {/* ETA overlay */}
            {routeInfo && clickedActivity.end && (
              <div className="absolute bottom-4 left-4 right-4 sm:right-auto rounded-xl bg-white/95 backdrop-blur-sm border border-gray-200/50 px-4 py-3 shadow-lg z-[1000] pointer-events-none">
                <p className="text-xs font-medium text-gray-500 mb-2">Estimated Travel</p>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-primary-red/10 flex items-center justify-center">
                      <svg className="w-4 h-4 text-primary-red" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-lg font-bold text-gray-900">{routeInfo.time}</p>
                      <p className="text-xs text-gray-500">min</p>
                    </div>
                  </div>
                  <div className="w-px h-10 bg-gray-200" />
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-primary-red/10 flex items-center justify-center">
                      <svg className="w-4 h-4 text-primary-red" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-lg font-bold text-gray-900">{routeInfo.distance}</p>
                      <p className="text-xs text-gray-500">km</p>
                    </div>
                  </div>
                </div>
                {/* Weather at destination */}
                <div className="mt-2 pt-2 border-t border-gray-100">
                  <WeatherWidget lat={clickedActivity.end[0]} lng={clickedActivity.end[1]} compact />
                </div>
              </div>
            )}
          </div>

          {/* Plan Details Card */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-5">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <StatusBadge status={plan.status === "Active" ? "Active" : plan.status === "Completed" ? "Completed" : "Draft"} size="md" />
                  {permissions.role && !permissions.isOwner && (
                    <span className="px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-600 rounded-full">
                      {permissions.role}
                    </span>
                  )}
                  {permissions.isOwner && (
                    <span className="px-2 py-0.5 text-xs font-medium bg-purple-100 text-purple-700 rounded-full">
                      Owner
                    </span>
                  )}
                </div>
                <h1 className="text-xl font-bold text-gray-900 line-clamp-1">{plan.title}</h1>
                <p className="text-gray-500 text-sm line-clamp-2 mt-1">{plan.description}</p>
              </div>
              
              {/* Actions */}
              <div className="flex flex-wrap items-center gap-2 shrink-0">
                {showStartNow && (
                  <button
                    className="px-4 py-2 bg-emerald-500 text-white rounded-xl font-medium hover:bg-emerald-600 transition-colors text-sm flex items-center gap-1.5"
                    onClick={handle_start}
                    disabled={updatePlanMutation.isPending}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {updatePlanMutation.isPending ? "Starting..." : "Start Trip"}
                  </button>
                )}
                {showEditPlan && (
                  <button
                    onClick={() => setActiveModal("plan")}
                    className="px-4 py-2 border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors text-sm"
                    disabled={updatePlanMutation.isPending}
                  >
                    Edit Plan
                  </button>
                )}
                {showRequestJoin && (
                  joinSuccess ? (
                    <span className="px-4 py-2 bg-green-100 text-green-700 rounded-xl text-sm font-medium flex items-center gap-1.5">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Request Sent
                    </span>
                  ) : (
                    <button
                      className="px-4 py-2 bg-primary-red text-white rounded-xl font-medium hover:bg-primary-red-dark transition-colors text-sm"
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
                  className="px-4 py-2 border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors text-sm flex items-center gap-1.5"
                  onClick={() => setActiveModal("collaborators")}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Team
                </button>
              </div>
            </div>
            
            {/* Plan meta */}
            <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-gray-100">
              <div className="flex items-center gap-1.5 text-sm text-gray-600">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span>{formatPlanDateRange(plan.start_date, plan.end_date)}</span>
              </div>
              {plan.slots && (
                <SlotsPill current={plan.approvedParticipants || 0} max={plan.slots} />
              )}
              {plan.accommodation ? (
                <div className="flex items-center gap-1.5 text-sm text-gray-600">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  <span className="truncate max-w-[200px]">{plan.accommodation.name}</span>
                </div>
              ) : (
                <span className="text-sm text-gray-400 italic">No accommodation</span>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN - Tabbed Panel */}
        <div className="w-full lg:w-[380px] xl:w-[420px] flex flex-col bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden max-h-[50vh] lg:max-h-none">
          {/* Tab Navigation */}
          <div className="flex border-b border-gray-100 bg-gray-50/50">
            <button
              onClick={() => setActiveRightTab("activities")}
              className={`flex-1 py-3.5 px-4 text-sm font-medium transition-colors relative ${
                activeRightTab === "activities"
                  ? "text-primary-red"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <span className="flex items-center justify-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                Activities
              </span>
              {activeRightTab === "activities" && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-red" />
              )}
            </button>
            <button
              onClick={() => setActiveRightTab("suggested")}
              className={`flex-1 py-3.5 px-4 text-sm font-medium transition-colors relative ${
                activeRightTab === "suggested"
                  ? "text-primary-red"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <span className="flex items-center justify-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                Suggested
              </span>
              {activeRightTab === "suggested" && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-red" />
              )}
            </button>
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-y-auto">
            {activeRightTab === "activities" && (
              <div className="p-4">
                {/* Day Selector with per-day weather */}
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="relative flex-1 min-w-0">
                    {/* Left fade */}
                    <div 
                      className={`absolute left-0 top-0 bottom-0 w-4 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none transition-opacity duration-200 ${
                        dayScrollFade.left ? 'opacity-100' : 'opacity-0'
                      }`} 
                    />
                    {/* Right fade */}
                    <div 
                      className={`absolute right-0 top-0 bottom-0 w-4 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none transition-opacity duration-200 ${
                        dayScrollFade.right ? 'opacity-100' : 'opacity-0'
                      }`} 
                    />
                    <div 
                      ref={dayScrollRef}
                      onScroll={handleDayScroll}
                      className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide scroll-smooth"
                    >
                      {Array.from({ length: days }, (_, i) => {
                        // Compute the ISO date for this day's weather forecast
                        const dayDate = dates.start
                          ? (() => {
                              const d = new Date(dates.start);
                              d.setDate(d.getDate() + i);
                              return d.toISOString().split('T')[0];
                            })()
                          : undefined;
                        // Use accommodation or plan location coordinates
                        const weatherLat = plan?.accommodation?.lat ?? 14.1154;
                        const weatherLng = plan?.accommodation?.lng ?? 120.962;

                        return (
                          <div key={i} className="flex flex-col items-center gap-0.5 shrink-0">
                            <button
                              onClick={() => click_day(i + 1)}
                              className={`px-3.5 py-2 text-xs font-medium rounded-lg whitespace-nowrap transition-colors duration-200 chip-interactive ${
                                daySelected === i + 1
                                  ? "bg-primary-red text-white shadow-sm"
                                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                              }`}
                            >
                              Day {i + 1}
                            </button>
                            {dayDate && (
                              <WeatherWidget
                                lat={weatherLat}
                                lng={weatherLng}
                                date={dayDate}
                                compact
                                className="text-[10px] px-0.5"
                              />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  {showAddActivity && (
                    <button
                      onClick={() => setActiveModal("activity")}
                      className="shrink-0 px-3 py-2 bg-primary-red text-white rounded-lg text-xs font-medium hover:bg-primary-red-dark transition-colors flex items-center gap-1"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Add
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
            setPrefillActivity(null);
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
