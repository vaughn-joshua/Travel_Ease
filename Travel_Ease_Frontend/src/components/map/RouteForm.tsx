import React, { useState } from "react";
import MapSearchBox from "./MapSearchBox";
import type { SearchResult, RouteSubmission } from "../../types/map";

// Default Location (Tagaytay City Center - fallback if geolocation fails)
const DEFAULT_LOCATION: SearchResult = {
  lat: 14.1154,
  lng: 120.962,
  name: "Tagaytay City Center",
  label: "Tagaytay City, Cavite, Philippines",
};

interface RouteFormProps {
  onRouteSubmit: (route: RouteSubmission) => void;
}

export default function RouteForm({ onRouteSubmit }: RouteFormProps): React.ReactElement {
  const [startPoint, setStartPoint] = useState<SearchResult | null>(null);
  const [endPoint, setEndPoint] = useState<SearchResult | null>(null);
  const [userLocation, setUserLocation] = useState<SearchResult | null>(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);

  const handleSubmit = (e: React.FormEvent): void => {
    e.preventDefault();
    console.log("[RouteForm] ========== ROUTE FORM SUBMITTED ==========");
    console.log("[RouteForm] startPoint:", startPoint);
    console.log("[RouteForm] endPoint:", endPoint);
    if (startPoint && endPoint) {
      console.log("[RouteForm] ✅ Both points selected, submitting route");
      const routeSubmission = {
        start: { lat: startPoint.lat, lng: startPoint.lng, name: startPoint.name },
        end: { lat: endPoint.lat, lng: endPoint.lng, name: endPoint.name },
      };
      console.log("[RouteForm] Route submission payload:", routeSubmission);
      onRouteSubmit(routeSubmission);
    } else {
      console.warn("[RouteForm] ❌ Cannot submit: missing start or end point");
    }
  };

  // Get user's actual current location using browser geolocation
  const useCurrentLocation = (setter: (result: SearchResult) => void): void => {
    if (!navigator.geolocation) {
      console.warn("[RouteForm] Geolocation not supported, using default location");
      setter(DEFAULT_LOCATION);
      return;
    }

    setIsGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        console.log("[RouteForm] ✅ Got user location:", { latitude, longitude });
        const location: SearchResult = {
          lat: latitude,
          lng: longitude,
          name: "My Location",
          label: `Current Location (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`,
        };
        setUserLocation(location);
        setter(location);
        setIsGettingLocation(false);
      },
      (error) => {
        console.error("[RouteForm] ❌ Error getting user location:", error);
        // Fallback to default location
        setter(DEFAULT_LOCATION);
        setIsGettingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white/95 backdrop-blur-md p-3 rounded-xl shadow-lg border border-white/50 space-y-2 relative z-[9996]">
      <div className="relative">
        <div className="flex items-center justify-between mb-1">
          <label className="text-xs text-gray-600">From:</label>
          <button
            type="button"
            onClick={() => useCurrentLocation(setStartPoint)}
            disabled={isGettingLocation}
            className="text-xs text-red-600 hover:text-red-700 hover:underline flex items-center gap-1 disabled:opacity-50 disabled:cursor-wait"
          >
            <span>{isGettingLocation ? "⏳" : "📍"}</span> Use Current Location
          </button>
        </div>
        <div className="relative z-[10000]">
          <MapSearchBox 
            onSearch={(result) => {
              console.log("[RouteForm] Start point selected:", result);
              setStartPoint(result);
            }} 
            placeholder="Start location" 
          />
        </div>
        {startPoint && (
          <p className="text-xs text-green-600 mt-1">✓ {startPoint.name}</p>
        )}
      </div>
      <div className="relative">
        <div className="flex items-center justify-between mb-1">
          <label className="text-xs text-gray-600">To:</label>
          <button
            type="button"
            onClick={() => useCurrentLocation(setEndPoint)}
            disabled={isGettingLocation}
            className="text-xs text-red-600 hover:text-red-700 hover:underline flex items-center gap-1 disabled:opacity-50 disabled:cursor-wait"
          >
            <span>{isGettingLocation ? "⏳" : "📍"}</span> Use Current Location
          </button>
        </div>
        <div className="relative z-[10000]">
          <MapSearchBox 
            onSearch={(result) => {
              console.log("[RouteForm] End point selected:", result);
              setEndPoint(result);
            }} 
            placeholder="Destination" 
          />
        </div>
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

