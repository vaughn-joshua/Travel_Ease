import React, { useState, useCallback } from "react";
import MapSearchBox from "./MapSearchBox";
import type { SearchResult, RouteSubmission, TransportProfile } from "../../types/map";

const DEFAULT_LOCATION: SearchResult = {
  lat: 14.1154,
  lng: 120.962,
  name: "Tagaytay City Center",
  label: "Tagaytay City, Cavite, Philippines",
};

const TRANSPORT_MODES: { value: TransportProfile; label: string; icon: React.ReactNode }[] = [
  {
    value: "driving-car",
    label: "Drive",
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10l2-1h2m6 0h2l2 1V8a1 1 0 00-1-1h-2" />
      </svg>
    ),
  },
  {
    value: "foot-walking",
    label: "Walk",
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14l-2 8m4-8l2 8m-6-4h4" />
      </svg>
    ),
  },
  {
    value: "cycling-regular",
    label: "Bike",
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <circle cx="5.5" cy="17.5" r="3.5" strokeWidth={2} />
        <circle cx="18.5" cy="17.5" r="3.5" strokeWidth={2} />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 6l-4 8h6l-3 3.5M5.5 17.5L9 10l3 4" />
      </svg>
    ),
  },
];

interface RouteFormProps {
  onRouteSubmit: (route: RouteSubmission) => void;
  profile: TransportProfile;
  onProfileChange: (profile: TransportProfile) => void;
}

export default function RouteForm({ onRouteSubmit, profile, onProfileChange }: RouteFormProps): React.ReactElement {
  const [startPoint, setStartPoint] = useState<SearchResult | null>(null);
  const [endPoint, setEndPoint] = useState<SearchResult | null>(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [startResetKey, setStartResetKey] = useState(0);
  const [endResetKey, setEndResetKey] = useState(0);

  const clearStartPoint = useCallback(() => {
    setStartPoint(null);
    setStartResetKey((k) => k + 1);
  }, []);

  const clearEndPoint = useCallback(() => {
    setEndPoint(null);
    setEndResetKey((k) => k + 1);
  }, []);

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

  const handleSwap = () => {
    const temp = startPoint;
    setStartPoint(endPoint);
    setEndPoint(temp);
  };

  const hasRoute = startPoint && endPoint;
  const canSubmit = startPoint && endPoint && 
    startPoint.lat !== undefined && startPoint.lng !== undefined &&
    endPoint.lat !== undefined && endPoint.lng !== undefined;

  return (
    <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-lg shadow-black/10 border border-white/60 overflow-hidden relative z-[9996]">
      {/* Collapsed Header / Toggle Button */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className={`
          w-full flex items-center justify-between p-3
          transition-colors duration-200
          ${isExpanded ? "bg-gray-50/50" : "hover:bg-gray-50/50"}
        `}
        aria-expanded={isExpanded}
        aria-controls="route-form-content"
      >
        <div className="flex items-center gap-3">
          <div className={`
            w-10 h-10 rounded-xl flex items-center justify-center
            transition-colors duration-200
            ${hasRoute ? "bg-green-100" : "bg-primary-red/10"}
          `}>
            {hasRoute ? (
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-5 h-5 text-primary-red" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
            )}
          </div>
          <div className="text-left">
            <span className={`text-sm font-semibold block ${hasRoute ? "text-green-700" : "text-gray-900"}`}>
              {hasRoute ? 'Route Ready' : 'Get Directions'}
            </span>
            {hasRoute ? (
              <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-0.5">
                <span className="truncate max-w-[80px]">{startPoint?.name}</span>
                <svg className="w-3 h-3 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
                <span className="truncate max-w-[80px]">{endPoint?.name}</span>
              </div>
            ) : (
              <span className="text-xs text-gray-500">Plan your route</span>
            )}
          </div>
        </div>
        <div className={`
          w-8 h-8 rounded-lg flex items-center justify-center
          transition-all duration-200
          ${isExpanded ? "bg-gray-200 rotate-180" : "bg-gray-100"}
        `}>
          <svg 
            className="w-4 h-4 text-gray-500"
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {/* Expandable Form Content */}
      <div 
        id="route-form-content"
        className={`
          transition-all duration-300 ease-out overflow-hidden
          ${isExpanded ? 'max-h-[min(600px,70dvh)] opacity-100' : 'max-h-0 opacity-0'}
        `}
      >
        <form onSubmit={handleSubmit} className="p-4 pt-0 space-y-4 border-t border-gray-100 max-h-[min(560px,calc(70dvh-2.5rem))] overflow-y-auto overscroll-contain scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
          {/* From Field */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-gray-600 flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full" />
                Starting Point
              </label>
              <button
                type="button"
                onClick={() => useCurrentLocation(setStartPoint)}
                disabled={isGettingLocation}
                className="
                  flex items-center gap-1.5 px-2.5 py-1 rounded-lg
                  text-xs font-medium
                  text-primary-red hover:bg-primary-red/10
                  transition-colors
                  disabled:opacity-50 disabled:cursor-wait
                "
              >
                {isGettingLocation ? (
                  <>
                    <svg className="w-3 h-3 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    <span>Getting...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span>Use current</span>
                  </>
                )}
              </button>
            </div>
            <div className="relative z-[10001]">
              <MapSearchBox
                key={`start-${startResetKey}`}
                onSearch={(result) => setStartPoint(result)} 
                placeholder="Enter start location" 
              />
            </div>
            {startPoint && (
              <div className="flex items-center gap-2 px-3 py-2 bg-green-50 rounded-lg border border-green-100">
                <svg className="w-4 h-4 text-green-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span className="text-xs text-green-700 font-medium truncate">{startPoint.name}</span>
                <button
                  type="button"
                  onClick={clearStartPoint}
                  className="ml-auto text-green-600 hover:text-green-800 p-0.5"
                  aria-label="Clear starting point"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}
          </div>

          {/* Swap Button */}
          <div className="flex justify-center">
            <button
              type="button"
              onClick={handleSwap}
              disabled={!startPoint && !endPoint}
              className="
                group p-2 rounded-xl
                bg-gray-100 hover:bg-gray-200
                text-gray-500 hover:text-gray-700
                transition-all duration-200
                disabled:opacity-30 disabled:cursor-not-allowed
                focus:outline-none focus:ring-2 focus:ring-primary-red/30
              "
              title="Swap start and destination"
            >
              <svg className="w-5 h-5 group-hover:rotate-180 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
              </svg>
            </button>
          </div>

          {/* To Field */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-gray-600 flex items-center gap-2">
                <span className="w-2 h-2 bg-red-500 rounded-full" />
                Destination
              </label>
              <button
                type="button"
                onClick={() => useCurrentLocation(setEndPoint)}
                disabled={isGettingLocation}
                className="
                  flex items-center gap-1.5 px-2.5 py-1 rounded-lg
                  text-xs font-medium
                  text-primary-red hover:bg-primary-red/10
                  transition-colors
                  disabled:opacity-50 disabled:cursor-wait
                "
              >
                {isGettingLocation ? (
                  <>
                    <svg className="w-3 h-3 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    <span>Getting...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span>Use current</span>
                  </>
                )}
              </button>
            </div>
            <div className="relative z-[10000]">
              <MapSearchBox
                key={`end-${endResetKey}`}
                onSearch={(result) => setEndPoint(result)} 
                placeholder="Enter destination" 
              />
            </div>
            {endPoint && (
              <div className="flex items-center gap-2 px-3 py-2 bg-red-50 rounded-lg border border-red-100">
                <svg className="w-4 h-4 text-red-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span className="text-xs text-red-700 font-medium truncate">{endPoint.name}</span>
                <button
                  type="button"
                  onClick={clearEndPoint}
                  className="ml-auto text-red-600 hover:text-red-800 p-0.5"
                  aria-label="Clear destination"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}
          </div>

          {/* Transport Mode */}
          <div className="flex items-center gap-1.5 p-1 bg-gray-100 rounded-xl">
            {TRANSPORT_MODES.map((mode) => (
              <button
                key={mode.value}
                type="button"
                onClick={() => onProfileChange(mode.value)}
                className={`
                  flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg
                  text-xs font-medium transition-all duration-200
                  ${profile === mode.value
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                  }
                `}
              >
                {mode.icon}
                <span className="hidden sm:inline">{mode.label}</span>
              </button>
            ))}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={!canSubmit}
            className={`
              w-full py-3 px-4 rounded-xl
              font-semibold text-sm
              flex items-center justify-center gap-2
              transition-all duration-200
              focus:outline-none focus:ring-2 focus:ring-offset-2
              ${canSubmit 
                ? "bg-primary-red text-white hover:bg-primary-red-dark shadow-lg shadow-primary-red/30 hover:shadow-xl hover:shadow-primary-red/40 focus:ring-primary-red" 
                : "bg-gray-100 text-gray-400 cursor-not-allowed"
              }
            `}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
            {canSubmit ? "Start Route" : "Select both locations"}
          </button>
        </form>
      </div>
    </div>
  );
}
