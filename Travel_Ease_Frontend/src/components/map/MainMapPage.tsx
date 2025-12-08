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

  // Sync selectedCategory with URL param
  useEffect(() => {
    setSelectedCategory(categoryFromUrl);
  }, [categoryFromUrl]);

  // Get user's current location
  const getUserLocation = useCallback((): void => {
    if (!navigator.geolocation) {
      console.warn("[MainMapPage] Geolocation is not supported by this browser");
      // Fallback to default location
      setUserLocation(DEFAULT_LOCATION);
      return;
    }

    setIsGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        console.log("[MainMapPage] ✅ Got user location:", { latitude, longitude });
        setUserLocation({
          lat: latitude,
          lng: longitude,
          name: "My Location",
          label: `Current Location (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`,
        });
        setIsGettingLocation(false);
      },
      (error) => {
        console.error("[MainMapPage] ❌ Error getting user location:", error);
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

  // Log category fetch status
  useEffect(() => {
    console.log("[MainMapPage] ========== CATEGORY FETCH STATUS ==========");
    console.log("[MainMapPage] selectedCategory:", selectedCategory);
    console.log("[MainMapPage] isLoadingSpots:", isLoadingSpots);
    console.log("[MainMapPage] spotsError:", spotsError);
    if (travelSpotsData) {
      console.log("[MainMapPage] travelSpotsData received:", {
        dataLength: travelSpotsData.data?.length || 0,
        fromCache: travelSpotsData.fromCache,
        message: travelSpotsData.message,
      });
    }
  }, [selectedCategory, isLoadingSpots, spotsError, travelSpotsData]);

  // Convert businesses to map markers
  const businessMarkers = useMemo((): MapMarker[] => {
    console.log("[MainMapPage] ========== CREATING BUSINESS MARKERS ==========");
    console.log("[MainMapPage] selectedCategory:", selectedCategory);
    console.log("[MainMapPage] travelSpotsData:", travelSpotsData);
    console.log("[MainMapPage] isLoadingSpots:", isLoadingSpots);
    console.log("[MainMapPage] spotsError:", spotsError);
    
    // Only show markers when a category is selected
    if (!selectedCategory) {
      console.log("[MainMapPage] ❌ No category selected, returning empty markers");
      return [];
    }
    
    // Return empty array if data is not yet loaded
    if (!travelSpotsData?.data) {
      console.log("[MainMapPage] ⏳ No data yet, returning empty markers");
      return [];
    }

    console.log(`[MainMapPage] ✅ Category "${selectedCategory}": Received ${travelSpotsData.data.length} businesses from API`);
    if (travelSpotsData.data.length > 0) {
      const firstBusiness = travelSpotsData.data[0];
      console.log('[MainMapPage] Sample business fields:', {
        business_id: firstBusiness.business_id,
        name: firstBusiness.name,
        latitude: firstBusiness.latitude,
        longitude: firstBusiness.longitude,
        // Check for longtitude typo variant
        longtitude: (firstBusiness as any).longtitude,
        allKeys: Object.keys(firstBusiness),
      });
    }

    const markers = travelSpotsData.data
      .filter((business) => {
        // Handle both longitude and longtitude (database typo)
        const lng = business.longitude ?? (business as any).longtitude;
        const lat = business.latitude;
        const hasCoords = lat != null && lng != null;
        
        if (!hasCoords) {
          console.warn(`[MainMapPage] ⚠️ Business "${business.name}" (ID: ${business.business_id}) missing coordinates`, {
            latitude: lat,
            longitude: business.longitude,
            longtitude: (business as any).longtitude,
            hasLatitude: lat != null,
            hasLongitude: business.longitude != null,
            hasLongtitude: (business as any).longtitude != null,
          });
        }
        return hasCoords;
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

    console.log(`[MainMapPage] ✅ Category "${selectedCategory}": Created ${markers.length} markers with valid coordinates`);
    if (markers.length > 0) {
      console.log("[MainMapPage] Sample marker:", markers[0]);
      console.log("[MainMapPage] All marker positions:", markers.map(m => m.position));
    } else {
      console.warn("[MainMapPage] ⚠️ No markers created! Check if businesses have coordinates.");
    }

    return markers;
  }, [selectedCategory, travelSpotsData, isLoadingSpots, spotsError]);

  // Log route state changes
  useEffect(() => {
    console.log("[MainMapPage] ========== ROUTE STATE UPDATE ==========");
    console.log("[MainMapPage] start:", start);
    console.log("[MainMapPage] end:", end);
    console.log("[MainMapPage] routeInfo:", routeInfo);
    if (start && end) {
      console.log("[MainMapPage] ✅ Route is active, RoutingMachine should be calculating");
    } else {
      console.log("[MainMapPage] ⏳ Route not active (waiting for start/end points)");
    }
  }, [start, end, routeInfo]);

  // Log business markers changes
  useEffect(() => {
    console.log("[MainMapPage] ========== BUSINESS MARKERS UPDATE ==========");
    console.log("[MainMapPage] businessMarkers count:", businessMarkers.length);
    console.log("[MainMapPage] businessMarkers:", businessMarkers);
    if (businessMarkers.length > 0) {
      console.log("[MainMapPage] ✅ Markers will be passed to MapPage");
      console.log("[MainMapPage] First 3 marker positions:", businessMarkers.slice(0, 3).map(m => m.position));
    } else {
      console.log("[MainMapPage] ⏳ No markers to display");
    }
  }, [businessMarkers]);

  // Callback for when route is found
  const handleRouteFound = useCallback((info: RouteInfo) => {
    console.log("[MainMapPage] ========== ROUTE FOUND ==========");
    console.log("[MainMapPage] Route info:", info);
    console.log("[MainMapPage] Distance:", info.distance, "km");
    console.log("[MainMapPage] Time:", info.time, "minutes");
    if (info.distance > 0 && info.time > 0) {
      console.log("[MainMapPage] ✅ Valid route found, setting route info");
      setRouteInfo(info);
    } else {
      console.log("[MainMapPage] ❌ Invalid route (distance or time is 0), clearing route info");
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
    console.log("[MainMapPage] ========== ROUTE SUBMITTED ==========");
    console.log("[MainMapPage] Start point:", {
      lat: startPoint.lat,
      lng: startPoint.lng,
      name: startPoint.name,
    });
    console.log("[MainMapPage] End point:", {
      lat: endPoint.lat,
      lng: endPoint.lng,
      name: endPoint.name,
    });
    console.log("[MainMapPage] Setting route start and end coordinates");
    setStart([startPoint.lat, startPoint.lng]);
    setEnd([endPoint.lat, endPoint.lng]);
    console.log("[MainMapPage] ✅ Route coordinates set, RoutingMachine will calculate route");
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
    console.log("[MainMapPage] ========== CATEGORY CLICKED ==========");
    console.log("[MainMapPage] Previous category:", selectedCategory);
    console.log("[MainMapPage] New category:", category);
    if (category) {
      setSelectedCategory(category);
      setSearchParams({ category }, { replace: true });
      console.log("[MainMapPage] ✅ Category selected, fetching businesses for category:", category);
      console.log("[MainMapPage] API will be called with params: { category:", category, ", limit: 100 }");
    } else {
      setSelectedCategory(null);
      setSearchParams({}, { replace: true });
      console.log("[MainMapPage] ✅ Category cleared, removing all pins");
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
    if (!search_result) return null;
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

      {/* Search and Category Controls - Upper Left (positioned to the right of nav menu) */}
      <div className="absolute top-4 left-20 z-[9998] flex items-start gap-3">
        {/* Search Box */}
        <div className="flex-shrink-0 relative z-[9999]">
          <MapSearchBox 
            onSearch={handleSearch}
            onAddToPlan={(result) => {
              set_search_result(result);
              setShowPlanModal(true);
            }}
          />
        </div>

        {/* Category Buttons */}
        <div className="flex flex-wrap gap-2 items-start">
          {CATEGORIES.map((category) => (
            <button
              key={category.value}
              type="button"
              onClick={() => handleCategoryClick(category.value)}
              disabled={isLoadingSpots && selectedCategory === category.value}
              className={`px-3 py-2 rounded-full text-xs font-medium transition-colors flex items-center gap-1.5 whitespace-nowrap ${
                selectedCategory === category.value
                  ? "bg-primary-red text-white border border-primary-red shadow-md"
                  : "bg-white/95 backdrop-blur-md text-gray-700 border border-gray-300 hover:border-primary-red hover:text-primary-red hover:bg-red-50 shadow-lg"
              } ${isLoadingSpots && selectedCategory === category.value ? "opacity-75 cursor-wait" : ""}`}
            >
              <span>{category.icon}</span>
              <span>{category.label}</span>
              {isLoadingSpots && selectedCategory === category.value && (
                <span className="ml-1">⏳</span>
              )}
            </button>
          ))}
          {selectedCategory && (
            <button
              onClick={() => handleCategoryClick(null)}
              className="px-3 py-2 rounded-full text-xs font-medium bg-gray-200 text-gray-700 border border-gray-300 hover:bg-gray-300 shadow-lg whitespace-nowrap"
              title="Clear category filter"
            >
              Clear
            </button>
          )}
        </div>
        {/* Debug info in development */}
        {import.meta.env.DEV && selectedCategory && (
          <div className="absolute top-16 left-20 bg-black/70 text-white text-xs px-2 py-1 rounded z-[9999]">
            {isLoadingSpots ? "Loading..." : spotsError ? "Error loading" : `${businessMarkers.length} businesses pinned`}
          </div>
        )}
      </div>

      {/* Route Controls - Positioned below search, with lower z-index */}
      <div className="absolute top-20 left-20 z-[9997] flex flex-col gap-2 max-w-sm">
        <RouteForm onRouteSubmit={handleRouteSubmit} />
        
        {/* ETA Display when route is active */}
        {routeInfo && start && end && (
          <div className="bg-white/95 backdrop-blur-md rounded-xl shadow-lg p-4 border border-white/50">
            <p className="text-xs text-gray-500 mb-2">Estimated Travel</p>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="font-semibold text-gray-900 text-lg">{routeInfo.time} min</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="font-semibold text-gray-900 text-lg">{routeInfo.distance} km</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Go to Current Location Button */}
      <button
        className="
          absolute bottom-24 right-4 z-[9998]
          w-12 h-12 rounded-full
          bg-white/95 backdrop-blur-md
          shadow-lg shadow-black/20
          border border-white/50
          flex items-center justify-center
          text-2xl
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
            // This prevents the "Add to Travel Plan" card from showing
            console.log("[MainMapPage] 📍 Centering map on user location (not adding to plan)");
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

      {/* Search Result Card */}
      {search_result && !start && !end && (
        <div 
          className="
            absolute bottom-24 left-4 z-[9998]
            w-80 bg-white/95 backdrop-blur-md
            rounded-xl shadow-xl shadow-black/20
            border border-white/50
            overflow-hidden
          "
        >
          <div className="p-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 truncate">{search_result.name}</h3>
                {search_result.label && search_result.label !== search_result.name && (
                  <p className="text-sm text-gray-500 mt-0.5 line-clamp-2">{search_result.label}</p>
                )}
                {search_result.address && (
                  <p className="text-xs text-gray-400 mt-1">
                    {[
                      search_result.address.barangay,
                      search_result.address.city,
                      search_result.address.province
                    ].filter(Boolean).join(", ")}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 mt-4">
              <button
                onClick={() => setShowPlanModal(true)}
                className="flex-1 hard_btn text-sm py-2"
              >
                <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Add to Travel Plan
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
          <div className="px-4 py-2 bg-gray-50 border-t border-gray-100 text-xs text-gray-500">
            📍 {search_result.lat.toFixed(4)}, {search_result.lng.toFixed(4)}
          </div>
        </div>
      )}

      {/* Clear Map Button (only show when there's content) */}
      {(search_result || start || end) && (
        <button
          className="
            absolute bottom-40 right-4 z-[9998]
            w-12 h-12 rounded-full
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
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}

      {/* ESC Exit Hint */}
      {showExitHint && (
        <div 
          className="
            absolute bottom-4 left-1/2 -translate-x-1/2 z-[9998]
            px-4 py-2 rounded-full
            bg-black/70 backdrop-blur-md
            text-white text-sm
            animate-fade-in
            transition-opacity duration-500
          "
        >
          Press <kbd className="px-2 py-0.5 mx-1 bg-white/20 rounded font-mono">ESC</kbd> to exit map
        </div>
      )}

      {/* Zoom hint */}
      <div 
        className="
          absolute bottom-4 right-4 z-[9997]
          px-3 py-1.5 rounded-lg
          bg-black/50 backdrop-blur-sm
          text-white/70 text-xs
        "
      >
        Scroll to zoom
      </div>

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
