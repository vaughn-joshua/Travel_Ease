import { useState, useMemo, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useOngoingPlans, useTravelPlanActivities } from "../../features/travelPlans/queries";
import LandingPage, { type MapMarker } from "../../pages/LandingPage";
import type { Activity } from "../../types/travelPlan";
import type { RouteInfo } from "../map/RoutingMachine";
import { formatPlanDateRange } from "../../utils/date";
import { 
  StatusBadge, 
  SlotsPill, 
  EmptyState, 
  ErrorState, 
  DbUnavailableBanner,
  PlanCardSkeleton 
} from "../ui/PlanCard";

const TAGAYTAY_CENTER: [number, number] = [14.1154, 120.962];

const formatBudgetRange = (range: string | null): string => {
  if (!range) return "";
  if (range.includes("+")) return `₱${range}`;
  const [min, max] = range.split("-");
  return `₱${min} - ₱${max}`;
};

export default function OngoingPlans(): React.ReactElement {
  const navigate = useNavigate();
  const { loading: authLoading } = useAuth();

  const [viewMode, setViewMode] = useState<"cards" | "detail">("cards");
  const [selectedPlanId, setSelectedPlanId] = useState<number | null>(null);
  const [selectedDay, setSelectedDay] = useState<number>(1);
  const [selectedActivity, setSelectedActivity] = useState<[number, number] | null>(null);
  const [routeInfo, setRouteInfo] = useState<RouteInfo | null>(null);
  const [focusedPosition, setFocusedPosition] = useState<[number, number] | null>(null);
  const [highlightedMarkerId, setHighlightedMarkerId] = useState<string | null>(null);

  const handleRouteFound = useCallback((info: RouteInfo) => {
    if (info.distance > 0 && info.time > 0) {
      setRouteInfo(info);
    } else {
      setRouteInfo(null);
    }
  }, []);

  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
  } = useOngoingPlans(!authLoading && Boolean(token));

  const plans = data?.plans ?? [];
  const dbUnavailable = data?.dbUnavailable ?? false;

  useEffect(() => {
    if (plans.length === 1) {
      setSelectedPlanId(plans[0].id);
      setViewMode("detail");
    }
  }, [plans]);

  const selectedPlan = useMemo(() => {
    if (plans.length === 0) return null;
    if (plans.length === 1) return plans[0];
    return plans.find(p => p.id === selectedPlanId) || null;
  }, [plans, selectedPlanId]);

  const { data: allActivities = [], isLoading: activitiesLoading } = useTravelPlanActivities(
    selectedPlan?.id
  );

  const days = useMemo(() => {
    if (!selectedPlan?.start_date || !selectedPlan?.end_date) return 1;
    const start = new Date(selectedPlan.start_date);
    const end = new Date(selectedPlan.end_date);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return 1;
    const diff = end.getTime() - start.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24)) + 1;
  }, [selectedPlan?.start_date, selectedPlan?.end_date]);

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

  const mapMarkers = useMemo((): MapMarker[] => {
    const markers: MapMarker[] = [];
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

  const handleViewPlanner = () => {
    if (selectedPlan) {
      navigate(`/planner/view/${selectedPlan.id}`);
    }
  };

  const handleCardClick = (planId: number) => {
    setSelectedPlanId(planId);
    setSelectedDay(1);
    setSelectedActivity(null);
    setRouteInfo(null);
    setFocusedPosition(null);
    setHighlightedMarkerId(null);
    setViewMode("detail");
  };

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

  // Loading state
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <PlanCardSkeleton />
        <PlanCardSkeleton />
      </div>
    );
  }

  // Error state
  if (isError) {
    return (
      <ErrorState
        message={(error as Error)?.message || "Failed to load ongoing plans"}
        onRetry={() => refetch()}
      />
    );
  }

  // Empty state
  if (plans.length === 0) {
    return (
      <EmptyState
        icon={
          <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
          </svg>
        }
        title={dbUnavailable ? "Couldn't load ongoing plans" : "No ongoing plans"}
        description={dbUnavailable ? "Please try again in a moment" : "Create a plan and start your adventure!"}
        action={dbUnavailable ? { label: "Retry", onClick: () => refetch() } : undefined}
        variant={dbUnavailable ? "warning" : "default"}
      />
    );
  }

  // Cards grid view
  if (plans.length > 1 && viewMode === "cards") {
    return (
      <div className="space-y-4">
        {dbUnavailable && <DbUnavailableBanner onRetry={() => refetch()} compact />}
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {plans.map((plan) => (
            <div
              key={plan.id}
              onClick={() => handleCardClick(plan.id)}
              className="group bg-white rounded-xl border border-gray-100 p-4 cursor-pointer hover:border-emerald-200 hover:shadow-md transition-all duration-200"
            >
              <div className="flex items-start justify-between gap-2 mb-3">
                <StatusBadge status="Active" />
                <svg 
                  className="w-4 h-4 text-gray-300 group-hover:text-emerald-500 group-hover:translate-x-0.5 transition-all" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
              
              <h3 className="font-semibold text-gray-900 line-clamp-1 mb-1 group-hover:text-emerald-700 transition-colors">
                {plan.title}
              </h3>
              
              <div className="flex items-center gap-1.5 text-sm text-gray-500 mb-2">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                </svg>
                <span className="truncate">{plan.location}</span>
              </div>
              
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-gray-600 bg-gray-50 rounded-lg">
                  <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  {formatPlanDateRange(plan.start_date, plan.end_date)}
                </span>
                {plan.max_slots && (
                  <SlotsPill current={plan.approvedParticipants || 0} max={plan.max_slots} />
                )}
              </div>

              {plan.accommodation && (
                <div className="pt-3 border-t border-gray-100">
                  <div className="flex items-center gap-1.5 text-sm text-gray-600">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    <span className="truncate">{plan.accommodation.name}</span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Detail view with map
  if (!selectedPlan) {
    return <></>;
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      {dbUnavailable && <DbUnavailableBanner onRetry={() => refetch()} />}
      
      <div className="grid min-h-[520px] grid-rows-[auto_auto] lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] lg:grid-rows-none">
        {/* Map Section */}
        <div className="relative h-[320px] sm:h-[400px] lg:h-full bg-gray-100">
          <LandingPage
            className="w-full h-full"
            start={TAGAYTAY_CENTER}
            end={selectedActivity}
            markers={mapMarkers}
            onRouteFound={handleRouteFound}
            focusPosition={focusedPosition}
          />
          
          {/* Plan title overlay */}
          <div className="absolute top-4 left-4 right-4 sm:right-auto sm:max-w-[70%] rounded-xl border border-gray-200/50 bg-white/95 backdrop-blur-sm px-4 py-3 shadow-lg pointer-events-none z-[12]">
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              <span className="text-xs font-medium text-emerald-600">Live Trip</span>
            </div>
            <h3 className="font-bold text-gray-900">{selectedPlan.title}</h3>
            <p className="text-xs text-gray-500">{selectedPlan.location}</p>
          </div>
          
          {/* Route info overlay */}
          {routeInfo && selectedActivity && (
            <div className="absolute bottom-4 left-4 right-4 sm:right-auto rounded-xl border border-gray-200/50 bg-white/95 backdrop-blur-sm px-4 py-3 shadow-lg pointer-events-none z-[12]">
              <p className="text-xs font-medium text-gray-500 mb-2">Estimated Travel</p>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5">
                  <div className="w-8 h-8 rounded-lg bg-primary-red/10 flex items-center justify-center">
                    <svg className="w-4 h-4 text-primary-red" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-gray-900">{routeInfo.time}</p>
                    <p className="text-xs text-gray-500">minutes</p>
                  </div>
                </div>
                <div className="w-px h-10 bg-gray-200" />
                <div className="flex items-center gap-1.5">
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
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="flex flex-col border-t border-gray-100 lg:border-t-0 lg:border-l bg-gray-50/50">
          {/* Back button for multi-plan view */}
          {plans.length > 1 && (
            <button
              onClick={handleBackToCards}
              className="flex items-center gap-2 px-4 py-3 text-sm text-gray-600 hover:text-primary-red hover:bg-white border-b border-gray-100 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to all plans
            </button>
          )}

          {/* Plan details */}
          <div className="p-4 bg-white border-b border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <StatusBadge status="Active" size="md" />
              <button
                onClick={handleViewPlanner}
                className="text-xs font-medium text-primary-red hover:text-primary-red-dark transition-colors flex items-center gap-1"
              >
                Full Planner
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </button>
            </div>
            
            <h3 className="font-bold text-gray-900 text-lg mb-2">{selectedPlan.title}</h3>
            
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-gray-600">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                </svg>
                {selectedPlan.location}
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                {formatPlanDateRange(selectedPlan.start_date, selectedPlan.end_date)}
              </div>
              {selectedPlan.max_slots && (
                <div className="flex items-center gap-2 text-gray-600">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {selectedPlan.approvedParticipants || 0}/{selectedPlan.max_slots} participants
                </div>
              )}
            </div>

            {/* Accommodation card */}
            {selectedPlan.accommodation && (
              <div className="mt-4 p-3 rounded-xl border border-gray-200 bg-gradient-to-br from-gray-50 to-white">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Accommodation</p>
                <p className="font-medium text-gray-900 flex items-center gap-2">
                  <svg className="w-4 h-4 text-primary-red" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  {selectedPlan.accommodation.name}
                </p>
                {selectedPlan.accommodation.lat && selectedPlan.accommodation.lng && (
                  <button
                    type="button"
                    onClick={handleFocusAccommodation}
                    className="mt-2 text-xs font-medium text-primary-red hover:text-primary-red-dark transition-colors"
                  >
                    Show on map →
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Day tabs */}
          <div className="flex gap-1.5 p-3 border-b border-gray-100 overflow-x-auto bg-white">
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
                className={`px-4 py-2 text-xs font-medium rounded-lg whitespace-nowrap transition-all ${
                  selectedDay === i + 1
                    ? "bg-primary-red text-white shadow-sm"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                Day {i + 1}
              </button>
            ))}
          </div>

          {/* Activities list */}
          <div className="flex-1 overflow-y-auto p-3">
            {activitiesLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-red"></div>
              </div>
            ) : activitiesForDay.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <p className="text-gray-500 text-sm">No activities for Day {selectedDay}</p>
                <p className="text-gray-400 text-xs mt-1">Open the full planner to add activities</p>
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
                      className={`p-3 rounded-xl border cursor-pointer transition-all ${
                        isSelected || isHighlighted
                          ? "border-primary-red bg-primary-red/5 shadow-sm"
                          : "border-gray-200 bg-white hover:border-primary-red/30 hover:shadow-sm"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {activity.is_priority && (
                          <div className="mt-0.5 w-6 h-6 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
                            <svg className="w-4 h-4 text-amber-600" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          {activity.name && (
                            <h4 className="font-medium text-gray-900 text-sm line-clamp-1">{activity.name}</h4>
                          )}
                          {activity.location && (
                            <p className="text-xs text-gray-500 line-clamp-1">{activity.location}</p>
                          )}
                          {(activity.brgy || activity.city) && (
                            <p className="text-xs text-gray-400 mt-0.5">
                              {[activity.brgy, activity.city].filter(Boolean).join(", ")}
                            </p>
                          )}
                          {activity.budget_range && (
                            <span className="inline-block mt-1 px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded">
                              {formatBudgetRange(activity.budget_range)}
                            </span>
                          )}
                        </div>
                        {activity.lat && activity.lng && (
                          <svg className={`w-4 h-4 shrink-0 transition-colors ${isSelected || isHighlighted ? 'text-primary-red' : 'text-gray-300'}`} fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
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
