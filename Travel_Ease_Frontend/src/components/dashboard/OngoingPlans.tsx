import { useState, useMemo, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useOngoingPlans, useTravelPlanActivities } from "../../features/travelPlans/queries";
import LandingPage, { type MapMarker } from "../../pages/LandingPage";
import type { Activity } from "../../types/travelPlan";
import type { RouteInfo } from "../map/RoutingMachine";
import { formatPlanDateRange } from "../../utils/date";

// Tagaytay center coordinates
const TAGAYTAY_CENTER: [number, number] = [14.1154, 120.962];

// Helper to format budget range for display
const formatBudgetRange = (range: string | null): string => {
  if (!range) return "";
  if (range.includes("+")) return `₱${range}`;
  const [min, max] = range.split("-");
  return `₱${min} - ₱${max}`;
};

export default function OngoingPlans(): React.ReactElement {
  const navigate = useNavigate();
  const { loading: authLoading } = useAuth();

  // State for view mode (cards vs detail)
  const [viewMode, setViewMode] = useState<"cards" | "detail">("cards");
  const [selectedPlanId, setSelectedPlanId] = useState<number | null>(null);

  // State for day selection and activity routing
  const [selectedDay, setSelectedDay] = useState<number>(1);
  const [selectedActivity, setSelectedActivity] = useState<[number, number] | null>(null);
  const [routeInfo, setRouteInfo] = useState<RouteInfo | null>(null);
  const [focusedPosition, setFocusedPosition] = useState<[number, number] | null>(null);
  const [highlightedMarkerId, setHighlightedMarkerId] = useState<string | null>(null);

  // Callback for when route is found
  const handleRouteFound = useCallback((info: RouteInfo) => {
    if (info.distance > 0 && info.time > 0) {
      setRouteInfo(info);
    } else {
      setRouteInfo(null);
    }
  }, []);

  // Check for token in localStorage to determine if user is authenticated
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  // Use TanStack Query hook for fetching ongoing plans
  const {
    data,
    isError,
    error,
    refetch,
  } = useOngoingPlans(!authLoading && Boolean(token));

  const plans = data?.plans ?? [];
  const dbUnavailable = data?.dbUnavailable ?? false;

  // Auto-select first plan when there's only one plan
  useEffect(() => {
    if (plans.length === 1) {
      setSelectedPlanId(plans[0].id);
      setViewMode("detail");
    }
  }, [plans]);

  // Get the selected plan (or first plan if only one)
  const selectedPlan = useMemo(() => {
    if (plans.length === 0) return null;
    if (plans.length === 1) return plans[0];
    return plans.find(p => p.id === selectedPlanId) || null;
  }, [plans, selectedPlanId]);

  // Fetch activities for the selected plan
  const { data: allActivities = [], isLoading: activitiesLoading } = useTravelPlanActivities(
    selectedPlan?.id
  );

  // Calculate number of days from plan dates
  const days = useMemo(() => {
    if (!selectedPlan?.start_date || !selectedPlan?.end_date) return 1;
    
    const start = new Date(selectedPlan.start_date);
    const end = new Date(selectedPlan.end_date);
    
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return 1;
    
    const diff = end.getTime() - start.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24)) + 1;
  }, [selectedPlan?.start_date, selectedPlan?.end_date]);

  // Filter activities by selected day
  const activitiesForDay = useMemo(() => {
    if (!allActivities.length || !selectedPlan?.start_date) return [];

    const startDate = new Date(selectedPlan.start_date);
    const targetDate = new Date(startDate.getTime() + (selectedDay - 1) * 24 * 60 * 60 * 1000);

    return allActivities.filter((activity) => {
      if (!activity.target_date) return false;
      const activityDate = new Date(activity.target_date);
      return activityDate.toDateString() === targetDate.toDateString();
    });
  }, [allActivities, selectedPlan?.start_date, selectedDay]);

  // Prepare markers for map (activities + accommodation)
  const mapMarkers = useMemo((): MapMarker[] => {
    const markers: MapMarker[] = [];

    // Add activity markers for the selected day
    activitiesForDay.forEach((activity) => {
      if (activity.lat && activity.lng) {
        markers.push({
          id: activity.activity_id ? `activity-${activity.activity_id}` : undefined,
          position: [activity.lat, activity.lng],
          type: activity.is_priority ? "priority" : "activity",
          name: activity.name || activity.location || undefined,
          description: [activity.brgy, activity.city].filter(Boolean).join(", ") || undefined,
        });
      }
    });

    // Add accommodation marker if available and has coordinates
    if (selectedPlan?.accommodation?.lat && selectedPlan?.accommodation?.lng) {
      markers.push({
        id: `accommodation-${selectedPlan.accommodation.business_id ?? selectedPlan.id}`,
        position: [selectedPlan.accommodation.lat, selectedPlan.accommodation.lng],
        type: "accommodation",
        name: selectedPlan.accommodation.name,
        description: selectedPlan.accommodation.city ?? undefined,
      });
    }

    return markers;
  }, [activitiesForDay, selectedPlan?.accommodation]);

  // Handle activity click - set route endpoint
  const handleActivityClick = (activity: Activity) => {
    if (activity.lat && activity.lng) {
      setSelectedActivity([activity.lat, activity.lng]);
      setFocusedPosition([activity.lat, activity.lng]);
      if (activity.activity_id) {
        setHighlightedMarkerId(`activity-${activity.activity_id}`);
      } else {
        setHighlightedMarkerId(null);
      }
    }
  };

  const handleFocusAccommodation = () => {
    const accommodation = selectedPlan?.accommodation;
    if (accommodation?.lat && accommodation?.lng) {
      setSelectedActivity(null);
      setRouteInfo(null);
      setFocusedPosition([accommodation.lat, accommodation.lng]);
      setHighlightedMarkerId(`accommodation-${accommodation.business_id ?? selectedPlan?.id ?? "primary"}`);
    }
  };

  // Navigate to full planner
  const handleViewPlanner = () => {
    if (selectedPlan) {
      navigate(`/planner/view/${selectedPlan.id}`);
    }
  };

  // Handle card click - switch to detail view
  const handleCardClick = (planId: number) => {
    setSelectedPlanId(planId);
    setSelectedDay(1);
    setSelectedActivity(null);
    setRouteInfo(null);
    setFocusedPosition(null);
    setHighlightedMarkerId(null);
    setViewMode("detail");
  };

  // Handle back button - return to cards view
  const handleBackToCards = () => {
    setViewMode("cards");
    setSelectedPlanId(null);
    setSelectedDay(1);
    setSelectedActivity(null);
    setRouteInfo(null);
    setFocusedPosition(null);
    setHighlightedMarkerId(null);
  };

  useEffect(() => {
    if (!selectedPlan) {
      setFocusedPosition(null);
      setHighlightedMarkerId(null);
      return;
    }

    if (selectedPlan.accommodation?.lat && selectedPlan.accommodation?.lng) {
      setFocusedPosition([selectedPlan.accommodation.lat, selectedPlan.accommodation.lng]);
      setHighlightedMarkerId(`accommodation-${selectedPlan.accommodation.business_id ?? selectedPlan.id}`);
    } else {
      setFocusedPosition(null);
      setHighlightedMarkerId(null);
    }

    setSelectedActivity(null);
    setRouteInfo(null);
  }, [selectedPlan?.id]);

  // Show error state with retry option
  if (isError) {
    return (
      <div className="text-center py-4">
        <p className="text-red-500 mb-2">
          {(error as Error)?.message || "Failed to load ongoing plans"}
        </p>
        <button
          onClick={() => refetch()}
          className="text-red-600 hover:underline"
        >
          Try again
        </button>
      </div>
    );
  }

  // Show empty state
  if (plans.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
          </svg>
        </div>
        <p className="text-gray-600 font-medium">
          {dbUnavailable ? "We’re having trouble loading your ongoing plans right now." : "No ongoing plans"}
        </p>
        <p className="text-sm text-gray-400 mt-1">
          {dbUnavailable ? "Please refresh or try again in a few moments." : "Create a new plan to get started!"}
        </p>
        {dbUnavailable && (
          <button
            onClick={() => refetch()}
            className="mt-4 text-sm font-medium text-red-500 hover:text-red-600 focus:outline-none focus:ring-2 focus:ring-red-500/50 rounded"
          >
            Retry loading plans
          </button>
        )}
      </div>
    );
  }

  // Show cards grid when multiple plans and in cards view
  if (plans.length > 1 && viewMode === "cards") {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-5">
        {dbUnavailable && (
          <div className="mb-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
            Some plans may be missing while we reconnect. Showing cached data.
          </div>
        )}
        <h3 className="font-semibold text-gray-900 mb-4">Ongoing Plans ({plans.length})</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {plans.map((plan) => (
            <div
              key={plan.id}
              onClick={() => handleCardClick(plan.id)}
              className="p-4 bg-gray-50 border border-gray-200 rounded-xl cursor-pointer hover:border-primary-red/30 hover:bg-primary-red/5 transition-all"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-primary-red bg-primary-red/10 px-2.5 py-1 rounded-full">
                  {plan.status}
                </span>
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
              <h4 className="font-semibold text-gray-900 mb-1 line-clamp-1">{plan.title}</h4>
              <p className="text-sm text-gray-500 mb-2 line-clamp-1">📍 {plan.location}</p>
              <p className="text-xs text-gray-400">
                📅 {formatPlanDateRange(plan.start_date, plan.end_date)}
              </p>
              {plan.accommodation && (
                <p className="text-xs text-gray-600 mt-1.5 flex items-center gap-1 line-clamp-1">
                  <span>🛏️</span> {plan.accommodation.name}
                </p>
              )}
              {plan.approvedParticipants !== undefined && (
                <p className="text-xs text-gray-400 mt-1">
                  👥 {plan.approvedParticipants}/{plan.max_slots} participants
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Show detail view (map + sidebar) - for single plan or when a plan is selected
  if (!selectedPlan) {
    return <></>;
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      {dbUnavailable && (
        <div className="px-5 py-3 bg-amber-50 border-b border-amber-200 text-xs text-amber-700">
          Some information may be out of date while we reconnect to the server.
        </div>
      )}
      <div className="grid min-h-[480px] grid-rows-[auto_auto] lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] lg:grid-rows-none">
        <div className="relative h-[320px] sm:h-[360px] lg:h-full">
          <LandingPage
            className="w-full h-full"
            start={TAGAYTAY_CENTER}
            end={selectedActivity}
            markers={mapMarkers}
            onRouteFound={handleRouteFound}
            focusPosition={focusedPosition}
          />
          <div className="absolute top-4 left-4 right-4 sm:right-auto max-w-[85%] sm:max-w-[70%] rounded-lg border border-gray-200 bg-white/95 px-4 py-2 shadow-md pointer-events-none z-[12]">
            <h3 className="font-semibold text-gray-900">{selectedPlan.title}</h3>
            <p className="text-xs text-gray-500">{selectedPlan.location}</p>
          </div>
          {routeInfo && selectedActivity && (
            <div className="absolute bottom-4 left-4 right-4 sm:right-auto rounded-lg border border-gray-200 bg-white/95 px-4 py-3 shadow-md pointer-events-none z-[12]">
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

        <div className="flex flex-col border-t border-gray-100 lg:border-t-0 lg:border-l">
          {plans.length > 1 && (
            <button
              onClick={handleBackToCards}
              className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:text-red-600 hover:bg-gray-50 border-b border-gray-100 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to all plans
            </button>
          )}

          <div className="p-4 border-b border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-red-600 bg-red-50 px-2 py-1 rounded-full">
                {selectedPlan.status}
              </span>
              <button
                onClick={handleViewPlanner}
                className="text-xs text-gray-500 hover:text-red-600 transition-colors"
              >
                Open Planner →
              </button>
            </div>
            <h3 className="font-semibold text-gray-900 text-lg mb-1">{selectedPlan.title}</h3>
            <p className="text-sm text-gray-500 mb-2">📍 {selectedPlan.location}</p>
            <p className="text-sm text-gray-600">
              📅 {formatPlanDateRange(selectedPlan.start_date, selectedPlan.end_date)}
            </p>
            {selectedPlan.approvedParticipants !== undefined && (
              <p className="text-xs text-gray-400 mt-1">
                👥 {selectedPlan.approvedParticipants}/{selectedPlan.max_slots} participants
              </p>
            )}

            {selectedPlan.accommodation && (
              <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50/80 p-3">
                <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-1">
                  Featured Accommodation
                </p>
                <p className="text-sm text-gray-900 font-medium flex items-center gap-2">
                  <span>🛏️</span> {selectedPlan.accommodation.name}
                </p>
                <div className="mt-2 flex items-center justify-between gap-2">
                  <p className="text-xs text-gray-500 truncate">
                    {selectedPlan.accommodation.city || "Tagaytay"}
                  </p>
                  {selectedPlan.accommodation.lat && selectedPlan.accommodation.lng && (
                    <button
                      type="button"
                      onClick={handleFocusAccommodation}
                      className="text-xs font-medium text-red-500 hover:text-red-600 transition-colors"
                    >
                      View on map →
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-1 p-2 border-b border-gray-100 overflow-x-auto">
            {Array.from({ length: days }, (_, i) => (
              <button
                key={i}
                onClick={() => {
                  setSelectedDay(i + 1);
                  setSelectedActivity(null);
                  setRouteInfo(null);
                  setFocusedPosition(null);
                  setHighlightedMarkerId(null);
                }}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
                  selectedDay === i + 1
                    ? "bg-red-500 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                Day {i + 1}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto p-3">
            {activitiesLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-red-600"></div>
              </div>
            ) : activitiesForDay.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <p className="text-sm">No activities for Day {selectedDay}</p>
              </div>
            ) : (
              <div className="space-y-2">
                {activitiesForDay.map((activity) => {
                  const markerId = activity.activity_id ? `activity-${activity.activity_id}` : null;
                  const isSelected =
                    selectedActivity &&
                    activity.lat &&
                    activity.lng &&
                    selectedActivity[0] === activity.lat &&
                    selectedActivity[1] === activity.lng;
                  const isHighlighted = markerId && highlightedMarkerId === markerId;

                  return (
                    <div
                      key={activity.activity_id}
                      onClick={() => handleActivityClick(activity)}
                      className={`p-3 rounded-lg border cursor-pointer transition-all ${
                        isSelected || isHighlighted
                          ? "border-red-500 bg-red-50"
                          : "border-gray-100 bg-gray-50 hover:border-red-200 hover:bg-red-50/50"
                      }`}
                    >
                      {activity.name && (
                        <h4 className="font-medium text-gray-900 text-sm">{activity.name}</h4>
                      )}
                      {activity.location && (
                        <p className="text-xs text-gray-600 mt-0.5">{activity.location}</p>
                      )}
                      {(activity.brgy || activity.city) && (
                        <p className="text-xs text-gray-400 mt-0.5">
                          {[activity.brgy, activity.city].filter(Boolean).join(", ")}
                        </p>
                      )}
                      {activity.budget_range && (
                        <p className="text-xs text-gray-500 mt-1">
                          {formatBudgetRange(activity.budget_range)}
                        </p>
                      )}
                      {activity.is_priority && (
                        <span className="inline-block text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded mt-1">
                          Priority
                        </span>
                      )}
                      {activity.lat && activity.lng && (
                        <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path
                              fillRule="evenodd"
                              d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                              clipRule="evenodd"
                            />
                          </svg>
                          Click to show route
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
