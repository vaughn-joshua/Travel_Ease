import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import MapPage from "./MapPage";
import MapSearchBox from "./MapSearchBox";
import RouteForm from "./RouteForm";
import MapNavMenu from "./MapNavMenu";
import SelectPlanModal from "./SelectPlanModal";
import type { SearchResult, RouteSubmission } from "../../types/map";
import type { RouteInfo } from "./RoutingMachine";

// Current Location (Tagaytay City Center - system focus area)
const CURRENT_LOCATION = {
  lat: 14.1154,
  lng: 120.962,
  name: "Current Location",
  label: "Tagaytay City, Cavite, Philippines",
};

export default function MainMapPage(): React.ReactElement {
  const navigate = useNavigate();
  const [search_result, set_search_result] = useState<SearchResult | null>(null);
  const [start, setStart] = useState<[number, number] | null>(null);
  const [end, setEnd] = useState<[number, number] | null>(null);
  const [showExitHint, setShowExitHint] = useState(true);
  const [showTagaytayMessage, setShowTagaytayMessage] = useState(false);
  const [routeInfo, setRouteInfo] = useState<RouteInfo | null>(null);
  const [showPlanModal, setShowPlanModal] = useState(false);

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
  };

  const handleSearch = (result: SearchResult): void => {
    set_search_result(result);
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
        onMapClear={handleClearMap}
        onRouteFound={handleRouteFound}
      />

      {/* Circular Navigation Menu */}
      <MapNavMenu />

      {/* Search and Route Controls */}
      <div className="absolute top-4 left-20 z-[9998] flex flex-col gap-2 max-w-sm">
        <MapSearchBox onSearch={handleSearch} />
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
        "
        title="Go to Current Location"
        onClick={() => {
          set_search_result({
            lat: CURRENT_LOCATION.lat,
            lng: CURRENT_LOCATION.lng,
            name: CURRENT_LOCATION.name,
            label: CURRENT_LOCATION.label,
          });
          setShowTagaytayMessage(true);
          setTimeout(() => setShowTagaytayMessage(false), 3000);
        }}
      >
        📍
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
