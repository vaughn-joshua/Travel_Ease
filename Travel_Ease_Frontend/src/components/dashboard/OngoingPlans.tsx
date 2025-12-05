import { useState, useMemo, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useOngoingPlans, useTravelPlanActivities } from "../../features/travelPlans/queries";
import LandingPage from "../../pages/LandingPage";
import type { Activity } from "../../types/travelPlan";
import type { RouteInfo } from "../map/RoutingMachine";

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
    data: plans = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useOngoingPlans(!authLoading && Boolean(token));

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

  // Handle activity click - set route endpoint
  const handleActivityClick = (activity: Activity) => {
    if (activity.lat && activity.lng) {
      setSelectedActivity([activity.lat, activity.lng]);
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
    setViewMode("detail");
  };

  // Handle back button - return to cards view
  const handleBackToCards = () => {
    setViewMode("cards");
    setSelectedPlanId(null);
    setSelectedDay(1);
    setSelectedActivity(null);
  };

  // Show loading while auth is resolving or plans are loading
  if (authLoading || isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
      </div>
    );
  }

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
        <p className="text-gray-600 font-medium">No ongoing plans</p>
        <p className="text-sm text-gray-400 mt-1">Create a new plan to get started!</p>
      </div>
    );
  }

  // Show cards grid when multiple plans and in cards view
  if (plans.length > 1 && viewMode === "cards") {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <h3 className="font-semibold text-gray-900 mb-4">Ongoing Plans ({plans.length})</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {plans.map((plan) => (
            <div
              key={plan.id}
              onClick={() => handleCardClick(plan.id)}
              className="p-4 border border-gray-200 rounded-lg cursor-pointer hover:border-red-300 hover:bg-red-50/50 transition-all"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-red-600 bg-red-50 px-2 py-1 rounded-full">
                  {plan.status}
                </span>
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
              <h4 className="font-semibold text-gray-900 mb-1">{plan.title}</h4>
              <p className="text-sm text-gray-500 mb-2">📍 {plan.location}</p>
              <p className="text-xs text-gray-400">
                📅 {plan.start_date} - {plan.end_date}
              </p>
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
      <div className="flex flex-col lg:flex-row h-[450px]">
        {/* Map Section - 2/3 width */}
        <div className="lg:w-2/3 h-full relative">
          <div className="w-full h-full z-0">
            <LandingPage
              className="w-full h-full"
              start={TAGAYTAY_CENTER}
              end={selectedActivity}
              onRouteFound={handleRouteFound}
            />
          </div>
          {/* Plan title overlay - outside map container */}
          <div className="absolute top-4 left-4 bg-white border border-gray-200 rounded-lg px-4 py-2 shadow-lg z-[1000] pointer-events-none">
            <h3 className="font-semibold text-gray-900">{selectedPlan.title}</h3>
            <p className="text-xs text-gray-500">{selectedPlan.location}</p>
          </div>
          {/* ETA overlay - outside map container to avoid Leaflet re-render issues */}
          {routeInfo && selectedActivity && (
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

        {/* Sidebar - 1/3 width */}
        <div className="lg:w-1/3 h-full flex flex-col border-l border-gray-100">
          {/* Back button when multiple plans */}
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

          {/* Plan Details Header */}
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
              📅 {selectedPlan.start_date} - {selectedPlan.end_date}
            </p>
            {selectedPlan.approvedParticipants !== undefined && (
              <p className="text-xs text-gray-400 mt-1">
                👥 {selectedPlan.approvedParticipants}/{selectedPlan.max_slots} participants
              </p>
            )}
          </div>

          {/* Day Tabs */}
          <div className="flex gap-1 p-2 border-b border-gray-100 overflow-x-auto">
            {Array.from({ length: days }, (_, i) => (
              <button
                key={i}
                onClick={() => {
                  setSelectedDay(i + 1);
                  setSelectedActivity(null); // Reset route when changing days
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

          {/* Activities List */}
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
                {activitiesForDay.map((activity) => (
                  <div
                    key={activity.activity_id}
                    onClick={() => handleActivityClick(activity)}
                    className={`p-3 rounded-lg border cursor-pointer transition-all ${
                      selectedActivity &&
                      selectedActivity[0] === activity.lat &&
                      selectedActivity[1] === activity.lng
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
                          <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                        </svg>
                        Click to show route
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
