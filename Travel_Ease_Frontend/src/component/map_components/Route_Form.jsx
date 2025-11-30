import React, { useState, useRef, useEffect, useCallback } from "react";
import { endpoints } from "../../config/api.js";

/**
 * Normalize place from API response
 */
function normalizePlace(place) {
  if (place.placeId !== undefined || place.coordinates) {
    return {
      label: place.label || '',
      lat: place.coordinates?.lat,
      lng: place.coordinates?.lng,
    };
  }
  // Legacy format
  return {
    label: place.display_name || '',
    lat: parseFloat(place.lat),
    lng: parseFloat(place.lon),
  };
}

function Route_Form({ onRouteSubmit }) {
  const [startLocation, setStartLocation] = useState("");
  const [endLocation, setEndLocation] = useState("");
  const [startCoords, setStartCoords] = useState(null);
  const [endCoords, setEndCoords] = useState(null);

  const [startSuggestions, setStartSuggestions] = useState([]);
  const [endSuggestions, setEndSuggestions] = useState([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [routeInfo, setRouteInfo] = useState(null);

  const startTimerRef = useRef(null);
  const endTimerRef = useRef(null);
  const abortRef = useRef(null);
  const formRef = useRef(null);

  // Cache for last successful route
  const lastRouteRef = useRef(null);

  // Hide dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (formRef.current && !formRef.current.contains(event.target)) {
        setStartSuggestions([]);
        setEndSuggestions([]);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearTimeout(startTimerRef.current);
      clearTimeout(endTimerRef.current);
      abortRef.current?.abort();
    };
  }, []);

  const fetchSuggestions = useCallback(async (value, setSuggestions, timerRef) => {
    clearTimeout(timerRef.current);
    
    if (value.length < 2) {
      setSuggestions([]);
      return;
    }

    timerRef.current = setTimeout(async () => {
      try {
        const response = await fetch(
          `${endpoints.map.suggestions}?query=${encodeURIComponent(value)}`
        );
        if (!response.ok) throw new Error('Failed to fetch');
        
        const data = await response.json();
        const suggestions = data.suggestions || data || [];
        setSuggestions(suggestions);
      } catch (error) {
        console.error("Error fetching suggestions:", error);
        setSuggestions([]);
      }
    }, 350);
  }, []);

  const fetchRoute = async (origin, destination) => {
    // Cancel any pending request
    abortRef.current?.abort();
    abortRef.current = new AbortController();

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(endpoints.map.route, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          origin: { lat: origin.lat, lng: origin.lng },
          destination: { lat: destination.lat, lng: destination.lng },
          profile: 'driving',
        }),
        signal: abortRef.current.signal,
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to fetch route');
      }

      const data = await response.json();
      const route = data.route;

      if (!route) {
        throw new Error('No route found between these locations');
      }

      // Cache successful route
      lastRouteRef.current = { origin, destination };

      // Set route info for display
      setRouteInfo({
        distance: route.distanceFormatted || `${(route.distance / 1000).toFixed(1)} km`,
        duration: route.durationFormatted || `${Math.round(route.duration / 60)} min`,
      });

      // Pass route data to parent
      onRouteSubmit({
        start: [origin.lat, origin.lng],
        end: [destination.lat, destination.lng],
        route: route,
      });

      setLoading(false);
    } catch (error) {
      if (error.name === 'AbortError') return;
      console.error("Route error:", error);
      setError(error.message);
      setLoading(false);
    }
  };

  const geocodeAddress = async (address) => {
    const response = await fetch(
      `${endpoints.map.geocode}?address=${encodeURIComponent(address)}`
    );
    
    if (!response.ok) return null;
    
    const data = await response.json();
    
    // Handle new format
    if (data.place) {
      const p = data.place;
      return { lat: p.coordinates?.lat, lng: p.coordinates?.lng };
    }
    
    // Legacy format
    if (data.length > 0) {
      return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
    }
    
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!startLocation.trim() || !endLocation.trim()) {
      setError("Please enter both starting point and destination.");
      return;
    }

    setLoading(true);

    try {
      // Use cached coords if available, otherwise geocode
      let origin = startCoords;
      let destination = endCoords;

      if (!origin) {
        origin = await geocodeAddress(startLocation);
        if (origin) setStartCoords(origin);
      }

      if (!destination) {
        destination = await geocodeAddress(endLocation);
        if (destination) setEndCoords(destination);
      }

      if (!origin || !destination) {
        throw new Error("Could not find coordinates for one or both locations.");
      }

      await fetchRoute(origin, destination);
    } catch (error) {
      setError(error.message);
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    if (lastRouteRef.current) {
      const { origin, destination } = lastRouteRef.current;
      fetchRoute(origin, destination);
    }
  };

  const handleStartChange = (e) => {
    const value = e.target.value;
    setStartLocation(value);
    setStartCoords(null); // Clear cached coords
    setRouteInfo(null);
    fetchSuggestions(value, setStartSuggestions, startTimerRef);
  };

  const handleEndChange = (e) => {
    const value = e.target.value;
    setEndLocation(value);
    setEndCoords(null); // Clear cached coords
    setRouteInfo(null);
    fetchSuggestions(value, setEndSuggestions, endTimerRef);
  };

  const handleStartSelect = (place) => {
    const normalized = normalizePlace(place);
    setStartLocation(normalized.label);
    setStartCoords({ lat: normalized.lat, lng: normalized.lng });
    setStartSuggestions([]);
  };

  const handleEndSelect = (place) => {
    const normalized = normalizePlace(place);
    setEndLocation(normalized.label);
    setEndCoords({ lat: normalized.lat, lng: normalized.lng });
    setEndSuggestions([]);
  };

  const getPlaceLabel = (place) => {
    return place.label || place.display_name || '';
  };

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      className="bg-white p-3 rounded-md shadow-md mt-3 w-80"
    >
      <h2 className="font-semibold mb-2 text-gray-700">Find Route</h2>

      {/* Start location input */}
      <div className="relative mb-2">
        <input
          type="text"
          placeholder="Start location"
          value={startLocation}
          onChange={handleStartChange}
          className="border w-full px-2 py-1.5 rounded focus:outline-none focus:ring-2 focus:ring-green-400"
          autoComplete="off"
          disabled={loading}
        />
        {startSuggestions.length > 0 && (
          <ul className="absolute top-full left-0 right-0 bg-white border border-gray-300 rounded-md max-h-48 overflow-y-auto shadow-md z-[100000]">
            {startSuggestions.map((place, index) => (
              <li
                key={place.place_id || place.placeId || index}
                onClick={() => handleStartSelect(place)}
                className="p-2 cursor-pointer hover:bg-gray-100 border-b text-sm truncate"
              >
                {getPlaceLabel(place)}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* End location input */}
      <div className="relative mb-3">
        <input
          type="text"
          placeholder="End location"
          value={endLocation}
          onChange={handleEndChange}
          className="border w-full px-2 py-1.5 rounded focus:outline-none focus:ring-2 focus:ring-green-400"
          autoComplete="off"
          disabled={loading}
        />
        {endSuggestions.length > 0 && (
          <ul className="absolute top-full left-0 right-0 bg-white border border-gray-300 rounded-md max-h-48 overflow-y-auto shadow-md z-[100000]">
            {endSuggestions.map((place, index) => (
              <li
                key={place.place_id || place.placeId || index}
                onClick={() => handleEndSelect(place)}
                className="p-2 cursor-pointer hover:bg-gray-100 border-b text-sm truncate"
              >
                {getPlaceLabel(place)}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Error display */}
      {error && (
        <div className="mb-2 p-2 bg-red-50 border border-red-200 rounded text-red-600 text-sm">
          {error}
        </div>
      )}

      {/* Route info display */}
      {routeInfo && !error && (
        <div className="mb-2 p-2 bg-green-50 border border-green-200 rounded text-sm">
          <div className="flex justify-between items-center">
            <div>
              <span className="font-medium text-green-700">ETA: </span>
              <span className="text-green-600">{routeInfo.duration}</span>
            </div>
            <div>
              <span className="font-medium text-green-700">Distance: </span>
              <span className="text-green-600">{routeInfo.distance}</span>
            </div>
          </div>
          <button
            type="button"
            onClick={handleRefresh}
            className="text-green-600 text-xs hover:underline mt-1"
            disabled={loading}
          >
            Refresh route
          </button>
        </div>
      )}

      {/* Submit button */}
      <button
        type="submit"
        disabled={loading}
        className="bg-green-500 hover:bg-green-600 disabled:bg-green-300 disabled:cursor-not-allowed text-white px-3 py-1.5 rounded w-full flex items-center justify-center gap-2 transition-colors"
      >
        {loading ? (
          <>
            <span className="inline-block animate-spin">&#8634;</span>
            <span>Finding route...</span>
          </>
        ) : (
          'Show Route'
        )}
      </button>
    </form>
  );
}

export default Route_Form;
