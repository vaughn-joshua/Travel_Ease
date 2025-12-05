import React, { useState } from "react";
import MapSearchBox from "./MapSearchBox";
import type { SearchResult, RouteSubmission } from "../../types/map";

// Tagaytay City Center coordinates (used as "Current Location" since system focus is Tagaytay)
const CURRENT_LOCATION: SearchResult = {
  lat: 14.1154,
  lng: 120.962,
  name: "Current Location",
  label: "Tagaytay City, Cavite, Philippines",
};

interface RouteFormProps {
  onRouteSubmit: (route: RouteSubmission) => void;
}

export default function RouteForm({ onRouteSubmit }: RouteFormProps): React.ReactElement {
  const [startPoint, setStartPoint] = useState<SearchResult | null>(null);
  const [endPoint, setEndPoint] = useState<SearchResult | null>(null);

  const handleSubmit = (e: React.FormEvent): void => {
    e.preventDefault();
    if (startPoint && endPoint) {
      onRouteSubmit({
        start: { lat: startPoint.lat, lng: startPoint.lng, name: startPoint.name },
        end: { lat: endPoint.lat, lng: endPoint.lng, name: endPoint.name },
      });
    }
  };

  const useCurrentLocation = (setter: (result: SearchResult) => void): void => {
    setter(CURRENT_LOCATION);
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white/95 backdrop-blur-md p-3 rounded-xl shadow-lg border border-white/50 space-y-2">
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="text-xs text-gray-600">From:</label>
          <button
            type="button"
            onClick={() => useCurrentLocation(setStartPoint)}
            className="text-xs text-red-600 hover:text-red-700 hover:underline flex items-center gap-1"
          >
            <span>📍</span> Use Current Location
          </button>
        </div>
        <MapSearchBox onSearch={setStartPoint} placeholder="Start location" />
        {startPoint && (
          <p className="text-xs text-green-600 mt-1">✓ {startPoint.name}</p>
        )}
      </div>
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="text-xs text-gray-600">To:</label>
          <button
            type="button"
            onClick={() => useCurrentLocation(setEndPoint)}
            className="text-xs text-red-600 hover:text-red-700 hover:underline flex items-center gap-1"
          >
            <span>📍</span> Use Current Location
          </button>
        </div>
        <MapSearchBox onSearch={setEndPoint} placeholder="Destination" />
        {endPoint && (
          <p className="text-xs text-green-600 mt-1">✓ {endPoint.name}</p>
        )}
      </div>
      <button
        type="submit"
        disabled={!startPoint || !endPoint}
        className="w-full hard_btn disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Get Route
      </button>
    </form>
  );
}

