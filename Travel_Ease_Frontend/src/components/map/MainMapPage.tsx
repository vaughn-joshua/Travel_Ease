import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import MapPage from "./MapPage";
import MapSearchBox from "./MapSearchBox";
import RouteForm from "./RouteForm";
import MapNavMenu from "./MapNavMenu";
import type { SearchResult, RouteSubmission } from "../../types/map";

export default function MainMapPage(): React.ReactElement {
  const navigate = useNavigate();
  const [search_result, set_search_result] = useState<SearchResult | null>(null);
  const [start, setStart] = useState<[number, number] | null>(null);
  const [end, setEnd] = useState<[number, number] | null>(null);
  const [showExitHint, setShowExitHint] = useState(true);

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
      />

      {/* Circular Navigation Menu */}
      <MapNavMenu />

      {/* Search and Route Controls */}
      <div className="absolute top-4 left-20 z-[9998] flex flex-col gap-2 max-w-sm">
        <MapSearchBox onSearch={handleSearch} />
        <RouteForm onRouteSubmit={handleRouteSubmit} />
      </div>

      {/* Current Location Button */}
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
        title="Go to current location"
        onClick={() => {
          navigator.geolocation.getCurrentPosition(
            (success) => {
              const { latitude, longitude } = success.coords;
              set_search_result({
                lat: latitude,
                lng: longitude,
                name: "Current Location",
                label: "Current Location",
              });
            },
            (error) => {
              console.error("Geolocation error:", error);
              alert("Unable to get your location. Please enable location services.");
            }
          );
        }}
      >
        📍
      </button>

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
    </div>
  );
}
