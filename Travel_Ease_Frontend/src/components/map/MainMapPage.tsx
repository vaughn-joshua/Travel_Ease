import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import MapPage from "./MapPage";
import MapSearchBox from "./MapSearchBox";
import RouteForm from "./RouteForm";
import MapNavMenu from "./MapNavMenu";
import SelectPlanModal from "./SelectPlanModal";
import { useTravelSpots } from "../../features/businesses/queries";
import type { SearchResult, RouteSubmission } from "../../types/map";
import type { RouteInfo } from "./RoutingMachine";
import type { MapMarker } from "../../pages/LandingPage";

// Main categories from backend enum
const CATEGORIES = [
  { value: "accommodation", label: "Accommodation", icon: "🏨" },
  { value: "food_drinks", label: "Food & Drinks", icon: "🍽️" },
  { value: "tours_activities", label: "Tours & Activities", icon: "🎯" },
  { value: "transport_transfers", label: "Transport & Transfers", icon: "🚗" },
  { value: "travel_services", label: "Travel Services", icon: "✈️" },
  { value: "shopping_souvenirs", label: "Shopping & Souvenirs", icon: "🛍️" },
  { value: "wellness_medical", label: "Wellness & Medical", icon: "💆" },
  { value: "events_experiences", label: "Events & Experiences", icon: "🎪" },
  { value: "outdoor_gear_rental", label: "Outdoor / Gear Rental", icon: "🎒" },
] as const;

// Default Location (Tagaytay City Center - system focus area)
const DEFAULT_LOCATION = {
  lat: 14.1154,
  lng: 120.962,
  name: "Tagaytay City Center",
  label: "Tagaytay City, Cavite, Philippines",
};

export default function MainMapPage(): React.ReactElement {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const categoryFromUrl = searchParams.get("category");
  
  // State for selected category (can be set from URL or button click)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(categoryFromUrl);
  
  const [search_result, set_search_result] = useState<SearchResult | null>(null);
  const [start, setStart] = useState<[number, number] | null>(null);
  const [end, setEnd] = useState<[number, number] | null>(null);
  const [showExitHint, setShowExitHint] = useState(true);
  const [showTagaytayMessage, setShowTagaytayMessage] = useState(false);
  const [routeInfo, setRouteInfo] = useState<RouteInfo | null>(null);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number; name: string; label: string } | null>(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [mapCenter, setMapCenter] = useState<[number, number] | null>(null); // For centering map without showing search result card
  const [showMobileFilters, setShowMobileFilters] = useState(false); // Mobile filter panel visibility

  // Sync selectedCategory with URL param
  useEffect(() => {
    setSelectedCategory(categoryFromUrl);
  }, [categoryFromUrl]);

  // Get user's current location
  const getUserLocation = useCallback((): void => {
    if (!navigator.geolocation) {
      // Fallback to default location
      setUserLocation(DEFAULT_LOCATION);
      return;
    }

    setIsGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setUserLocation({
          lat: latitude,
          lng: longitude,
          name: "My Location",
          label: `Current Location (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`,
        });
        setIsGettingLocation(false);
      },
      () => {
        // Fallback to default location
        setUserLocation(DEFAULT_LOCATION);
        setIsGettingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  }, []);

  // Try to get user location on mount
  useEffect(() => {
    getUserLocation();
  }, [getUserLocation]);

  // Fetch businesses by category
  const { data: travelSpotsData, isLoading: isLoadingSpots, error: spotsError } = useTravelSpots({
    category: selectedCategory || undefined,
    limit: 100, // Get more businesses for map display
  });


  // Convert businesses to map markers
  const businessMarkers = useMemo((): MapMarker[] => {
    // Only show markers when a category is selected
    if (!selectedCategory) return [];
    
    // Return empty array if data is not yet loaded
    if (!travelSpotsData?.data) return [];

    const markers = travelSpotsData.data
      .filter((business) => {
        // Handle both longitude and longtitude (database typo)
        const lng = business.longitude ?? (business as any).longtitude;
        const lat = business.latitude;
        return lat != null && lng != null;
      })
      .map((business) => {
        // Handle both longitude and longtitude (database typo)
        const lng = business.longitude ?? (business as any).longtitude;
        const lat = business.latitude!;
        
        return {
          position: [lat, lng!] as [number, number],
          type: 'activity' as const,
          name: business.name,
          business_id: business.business_id,
          city: business.city,
          brgy: business.brgy,
          street: business.street,
          description: business.description,
        };
      });

    return markers;
  }, [selectedCategory, travelSpotsData]);


  // Callback for when route is found
  const handleRouteFound = useCallback((info: RouteInfo) => {
    if (info.distance > 0 && info.time > 0) {
      setRouteInfo(info);
    } else {
      setRouteInfo(null);
    }
  }, []);

  // Handle ESC key to exit fullscreen (navigate to homepage)
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        navigate("/"); // Go to homepage
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [navigate]);

  // Hide exit hint after 5 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowExitHint(false);
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  const handleRouteSubmit = ({ start: startPoint, end: endPoint }: RouteSubmission): void => {
    setStart([startPoint.lat, startPoint.lng]);
    setEnd([endPoint.lat, endPoint.lng]);
  };

  const handleClearMap = (): void => {
    set_search_result(null);
    setStart(null);
    setEnd(null);
    setRouteInfo(null);
    setMapCenter(null);
    // Clear category
    setSelectedCategory(null);
    setSearchParams({}, { replace: true });
  };

  // Handle category click - update URL and fetch businesses
  const handleCategoryClick = (category: string | null): void => {
    if (category) {
      setSelectedCategory(category);
      setSearchParams({ category }, { replace: true });
    } else {
      setSelectedCategory(null);
      setSearchParams({}, { replace: true });
    }
  };

  const handleSearch = (result: SearchResult): void => {
    set_search_result(result);
  };

  // Handle marker click - convert business marker to SearchResult
  const handleMarkerClick = (marker: MapMarker & { business_id?: number; city?: string | null; brgy?: string | null; street?: string | null; description?: string | null }): void => {
    if (!marker.business_id) return; // Only handle business markers with business_id
    
    const searchResult: SearchResult = {
      lat: marker.position[0],
      lng: marker.position[1],
      name: marker.name || 'Unknown Business',
      label: marker.name || 'Unknown Business',
      business_id: marker.business_id,
      address: {
        city: marker.city || undefined,
        barangay: marker.brgy || undefined,
      },
    };
    
    set_search_result(searchResult);
  };

  const getSearchPosition = (): [number, number] | null => {
    if (!search_result || search_result.lat === undefined || search_result.lng === undefined) return null;
    return [search_result.lat, search_result.lng];
  };

  return (
    <div className="fixed inset-0 w-screen h-screen overflow-hidden bg-gray-900">
      {/* Fullscreen Map */}
      <MapPage
        search_result={getSearchPosition()}
        start={start}
        end={end}
        businessMarkers={businessMarkers}
        mapCenter={mapCenter}
        onMapClear={handleClearMap}
        onRouteFound={handleRouteFound}
        onMarkerClick={handleMarkerClick}
      /> 

      {/* Circular Navigation Menu */}
      <MapNavMenu />

      {/* Top Controls - Search Box Only */}
      <div className="absolute top-4 left-16 sm:left-20 right-4 z-[9998]">
        <div className="flex items-center gap-3">
          {/* Search Box */}
          <div className="flex-shrink-0 w-64 sm:w-80 relative z-[9999]">
            <MapSearchBox 
              onSearch={handleSearch}
              onAddToPlan={(result) => {
                set_search_result(result);
                setShowPlanModal(true);
              }}
            />
          </div>
          
          {/* Active filter indicator - iOS glass effect */}
          {selectedCategory && (
            <div className="flex items-center gap-2 px-4 py-2.5 bg-white/70 backdrop-blur-xl rounded-xl text-sm shadow-lg border border-white/50 text-gray-800">
              <span className="text-base">{CATEGORIES.find(c => c.value === selectedCategory)?.icon}</span>
              <span className="font-semibold text-primary-red">{CATEGORIES.find(c => c.value === selectedCategory)?.label}</span>
              <button 
                onClick={() => handleCategoryClick(null)}
                className="ml-1 hover:bg-gray-200/50 rounded-full p-1 transition-colors text-gray-500 hover:text-primary-red"
                title="Clear filter"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Slide-Up Filter Panel */}
      <div 
        className={`
          fixed bottom-0 left-0 right-0 z-[9997]
          transition-transform duration-500 ease-out
          ${showMobileFilters ? 'translate-y-0' : 'translate-y-[calc(100%-56px)]'}
        `}
      >
        {/* Glass morphism panel */}
        <div className="bg-white/90 backdrop-blur-xl border-t border-gray-200/50 shadow-[0_-8px_30px_rgba(0,0,0,0.12)] rounded-t-3xl">
          {/* Pull tab / Handle */}
          <button
            onClick={() => setShowMobileFilters(!showMobileFilters)}
            className="w-full flex flex-col items-center pt-3 pb-2 group cursor-pointer"
            aria-label={showMobileFilters ? "Close filters" : "Open filters"}
          >
            {/* Drag handle indicator */}
            <div className="w-12 h-1 bg-gray-300 rounded-full mb-2 group-hover:bg-primary-red transition-colors" />
            
            {/* Arrow and label */}
            <div className="flex items-center gap-2 text-gray-600 group-hover:text-primary-red transition-colors">
              <svg 
                className={`w-5 h-5 transition-transform duration-300 ${showMobileFilters ? 'rotate-180' : ''}`}
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
              </svg>
              <span className="text-sm font-medium">
                {showMobileFilters ? 'Close Filters' : 'Filter by Category'}
              </span>
            </div>
          </button>

          {/* Filter content */}
          <div className="px-4 sm:px-6 lg:px-8 pb-6 pt-2">
            {/* Category Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3">
              {CATEGORIES.map((category, index) => (
                <button
                  key={category.value}
                  type="button"
                  onClick={() => {
                    handleCategoryClick(category.value);
                    // Auto-close on mobile after selection
                    if (window.innerWidth < 640) {
                      setTimeout(() => setShowMobileFilters(false), 300);
                    }
                  }}
                  disabled={isLoadingSpots && selectedCategory === category.value}
                  style={{ 
                    animationDelay: showMobileFilters ? `${index * 40}ms` : '0ms',
                  }}
                  className={`
                    filter-panel-btn
                    relative flex items-center gap-2 px-3 py-3 sm:py-4 rounded-xl text-sm font-medium
                    transition-all duration-200 ease-out
                    hover:scale-[1.02] active:scale-[0.98]
                    ${selectedCategory === category.value
                      ? "bg-primary-red text-white shadow-lg shadow-primary-red/25"
                      : "bg-white text-gray-700 border border-gray-200 hover:border-primary-red hover:text-primary-red hover:bg-red-50/50 shadow-sm hover:shadow-md"
                    }
                    ${isLoadingSpots && selectedCategory === category.value ? "opacity-75" : ""}
                  `}
                >
                  <span className="text-lg">{category.icon}</span>
                  <span className="flex-1 text-left truncate">{category.label}</span>
                  {isLoadingSpots && selectedCategory === category.value && (
                    <svg className="w-4 h-4 animate-spin flex-shrink-0" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  )}
                  {selectedCategory === category.value && !isLoadingSpots && (
                    <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
              ))}
            </div>

            {/* Clear filter button */}
            {selectedCategory && (
              <div className="mt-4 flex justify-center">
                <button
                  onClick={() => {
                    handleCategoryClick(null);
                    setTimeout(() => setShowMobileFilters(false), 200);
                  }}
                  className="px-6 py-2.5 rounded-xl text-sm font-medium bg-gray-100 text-gray-700 border border-gray-200 hover:bg-red-50 hover:text-red-600 hover:border-red-300 transition-all duration-200 flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Clear Filter
                </button>
              </div>
            )}

            {/* Results count in dev mode */}
            {import.meta.env.DEV && selectedCategory && (
              <div className="mt-3 text-center text-xs text-gray-500">
                {isLoadingSpots ? "Loading businesses..." : spotsError ? "Error loading businesses" : `${businessMarkers.length} businesses found`}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Overlay when filter panel is open */}
      {showMobileFilters && (
        <div 
          className="fixed inset-0 bg-black/20 z-[9996] transition-opacity duration-300"
          onClick={() => setShowMobileFilters(false)}
        />
      )}

      {/* Route Controls - Responsive positioning */}
      <div className="absolute top-28 sm:top-20 left-4 sm:left-20 z-[9997] flex flex-col gap-2 w-[calc(100%-2rem)] sm:w-auto sm:max-w-sm">
        <RouteForm onRouteSubmit={handleRouteSubmit} />
        
        {/* ETA Display when route is active */}
        {routeInfo && start && end && (
          <div className="bg-white/95 backdrop-blur-md rounded-xl shadow-lg p-3 sm:p-4 border border-white/50">
            <p className="text-xs text-gray-500 mb-2">Estimated Travel</p>
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="font-semibold text-gray-900 text-base sm:text-lg">{routeInfo.time} min</span>
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="font-semibold text-gray-900 text-base sm:text-lg">{routeInfo.distance} km</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Go to Current Location Button - responsive positioning */}
      <button
        className="
          absolute bottom-24 sm:bottom-28 right-4 z-[9998]
          w-10 h-10 sm:w-12 sm:h-12 rounded-full
          bg-white/95 backdrop-blur-md
          shadow-lg shadow-black/20
          border border-white/50
          flex items-center justify-center
          text-xl sm:text-2xl
          transition-all duration-200
          hover:scale-105 hover:shadow-xl hover:bg-white
          focus:outline-none focus:ring-2 focus:ring-primary-red
          active:scale-95
          disabled:opacity-50 disabled:cursor-wait
        "
        title="Go to Current Location"
        disabled={isGettingLocation}
        onClick={() => {
          if (userLocation) {
            // Just center the map on user location, don't set search_result
            setMapCenter([userLocation.lat, userLocation.lng]);
            setShowTagaytayMessage(true);
            setTimeout(() => setShowTagaytayMessage(false), 3000);
          } else {
            // If no user location yet, try to get it
            getUserLocation();
          }
        }}
      >
        {isGettingLocation ? "⏳" : "📍"}
      </button>

      {/* Focus Area Message */}
      {showTagaytayMessage && (
        <div 
          className="
            absolute top-20 left-1/2 -translate-x-1/2 z-[9999]
            px-4 py-2 rounded-lg
            bg-red-600 text-white
            shadow-lg
            animate-fade-in
          "
        >
          🎯 System focus: Tagaytay City
        </div>
      )}

      {/* Search Result Card - responsive positioning */}
      {search_result && !start && !end && (
        <div 
          className="
            absolute bottom-20 sm:bottom-24 left-4 right-4 sm:right-auto z-[9998]
            sm:w-80 bg-white/95 backdrop-blur-md
            rounded-xl shadow-xl shadow-black/20
            border border-white/50
            overflow-hidden
          "
        >
          <div className="p-3 sm:p-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 text-sm sm:text-base truncate">{search_result.name}</h3>
                {search_result.label && search_result.label !== search_result.name && (
                  <p className="text-xs sm:text-sm text-gray-500 mt-0.5 line-clamp-2">{search_result.label}</p>
                )}
                {search_result.address && (
                  <p className="text-xs text-gray-400 mt-1 truncate">
                    {[
                      search_result.address.barangay,
                      search_result.address.city,
                      search_result.address.province
                    ].filter(Boolean).join(", ")}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 mt-3 sm:mt-4">
              <button
                onClick={() => setShowPlanModal(true)}
                className="flex-1 hard_btn text-xs sm:text-sm py-2"
              >
                <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <span className="hidden sm:inline">Add to Travel Plan</span>
                <span className="sm:hidden">Add to Plan</span>
              </button>
              <button
                onClick={() => set_search_result(null)}
                className="soft_btn text-sm py-2 px-3"
                title="Close"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
          <div className="px-3 sm:px-4 py-2 bg-gray-50 border-t border-gray-100 text-xs text-gray-500">
            📍 {search_result.lat?.toFixed(4) ?? '0.0000'}, {search_result.lng?.toFixed(4) ?? '0.0000'}
          </div>
        </div>
      )}

      {/* Clear Map Button (only show when there's content) - responsive */}
      {(search_result || start || end) && (
        <button
          className="
            absolute bottom-32 sm:bottom-40 right-4 z-[9998]
            w-10 h-10 sm:w-12 sm:h-12 rounded-full
            bg-red-500/90 backdrop-blur-md
            shadow-lg shadow-black/20
            border border-red-400/50
            flex items-center justify-center
            text-white
            transition-all duration-200
            hover:scale-105 hover:shadow-xl hover:bg-red-600
            focus:outline-none focus:ring-2 focus:ring-red-400
            active:scale-95
          "
          title="Clear map"
          onClick={handleClearMap}
        >
          <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}

      {/* ESC Exit Hint - responsive */}
      {showExitHint && (
        <div 
          className="
            absolute bottom-4 left-1/2 -translate-x-1/2 z-[9998]
            px-3 sm:px-4 py-1.5 sm:py-2 rounded-full
            bg-black/70 backdrop-blur-md
            text-white text-xs sm:text-sm
            animate-fade-in
            transition-opacity duration-500
            max-w-[90vw] text-center
          "
        >
          <span className="hidden sm:inline">Press <kbd className="px-2 py-0.5 mx-1 bg-white/20 rounded font-mono">ESC</kbd> to exit map</span>
          <span className="sm:hidden">Tap TE menu to exit</span>
        </div>
      )}


      {/* Select Plan Modal */}
      {showPlanModal && search_result && (
        <SelectPlanModal
          searchResult={search_result}
          onClose={() => setShowPlanModal(false)}
        />
      )}
    </div>
  );
}
