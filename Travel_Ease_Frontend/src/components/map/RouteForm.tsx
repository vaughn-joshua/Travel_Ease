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
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const handleSubmit = (e: React.FormEvent): void => {
    e.preventDefault();
    if (startPoint && endPoint && 
        startPoint.lat !== undefined && startPoint.lng !== undefined &&
        endPoint.lat !== undefined && endPoint.lng !== undefined) {
      const routeSubmission: RouteSubmission = {
        start: { lat: startPoint.lat, lng: startPoint.lng, name: startPoint.name },
        end: { lat: endPoint.lat, lng: endPoint.lng, name: endPoint.name },
      };
      onRouteSubmit(routeSubmission);
      setIsExpanded(false);
    }
  };

  // Get user's actual current location using browser geolocation
  const useCurrentLocation = (setter: (result: SearchResult) => void): void => {
    if (!navigator.geolocation) {
      setter(DEFAULT_LOCATION);
      return;
    }

    setIsGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const location: SearchResult = {
          lat: latitude,
          lng: longitude,
          name: "My Location",
          label: `Current Location (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`,
        };
        setter(location);
        setIsGettingLocation(false);
      },
      () => {
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

  const hasRoute = startPoint && endPoint;

  return (
    <div className="bg-white/95 backdrop-blur-md rounded-xl shadow-lg border border-white/50 overflow-hidden relative z-[9996]">
      {/* Collapsed Header / Toggle Button */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-3 hover:bg-gray-50/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary-red/10 rounded-lg flex items-center justify-center">
            <svg className="w-4 h-4 text-primary-red" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
          </div>
          <div className="text-left">
            <span className="text-sm font-medium text-gray-900">
              {hasRoute ? 'Route Set' : 'Get Directions'}
            </span>
            {hasRoute && (
              <p className="text-xs text-gray-500 truncate max-w-[150px]">
                {startPoint?.name} → {endPoint?.name}
              </p>
            )}
          </div>
        </div>
        <svg 
          className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Expandable Form Content */}
      <div 
        className={`
          overflow-hidden transition-all duration-300 ease-out
          ${isExpanded ? 'max-h-[400px] opacity-100' : 'max-h-0 opacity-0'}
        `}
      >
        <form onSubmit={handleSubmit} className="p-3 pt-0 space-y-3 border-t border-gray-100">
          {/* From Field */}
          <div className="relative">
            <div className="flex items-center justify-between mb-1.5 gap-2">
              <label className="text-xs font-medium text-gray-600 flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                From
              </label>
              <button
                type="button"
                onClick={() => useCurrentLocation(setStartPoint)}
                disabled={isGettingLocation}
                className="text-xs text-primary-red hover:text-primary-red-dark flex items-center gap-1 disabled:opacity-50 disabled:cursor-wait"
              >
                <span>{isGettingLocation ? "⏳" : "📍"}</span> 
                <span>Current</span>
              </button>
            </div>
            <div className="relative z-[10000]">
              <MapSearchBox 
                onSearch={(result) => setStartPoint(result)} 
                placeholder="Enter start location" 
              />
            </div>
            {startPoint && (
              <p className="text-xs text-green-600 mt-1 truncate flex items-center gap-1">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                {startPoint.name}
              </p>
            )}
          </div>

          {/* Swap Button */}
          <div className="flex justify-center -my-1">
            <button
              type="button"
              onClick={() => {
                const temp = startPoint;
                setStartPoint(endPoint);
                setEndPoint(temp);
              }}
              disabled={!startPoint && !endPoint}
              className="p-1.5 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-700 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              title="Swap locations"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
              </svg>
            </button>
          </div>

          {/* To Field */}
          <div className="relative">
            <div className="flex items-center justify-between mb-1.5 gap-2">
              <label className="text-xs font-medium text-gray-600 flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-red-500 rounded-full"></span>
                To
              </label>
              <button
                type="button"
                onClick={() => useCurrentLocation(setEndPoint)}
                disabled={isGettingLocation}
                className="text-xs text-primary-red hover:text-primary-red-dark flex items-center gap-1 disabled:opacity-50 disabled:cursor-wait"
              >
                <span>{isGettingLocation ? "⏳" : "📍"}</span>
                <span>Current</span>
              </button>
            </div>
            <div className="relative z-[10000]">
              <MapSearchBox 
                onSearch={(result) => setEndPoint(result)} 
                placeholder="Enter destination" 
              />
            </div>
            {endPoint && (
              <p className="text-xs text-green-600 mt-1 truncate flex items-center gap-1">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                {endPoint.name}
              </p>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={!startPoint || !endPoint}
            className="w-full py-2.5 px-4 bg-primary-red text-white font-medium rounded-lg text-sm
              hover:bg-primary-red-dark transition-colors
              disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed
              flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
            Get Route
          </button>
        </form>
      </div>
    </div>
  );
}
