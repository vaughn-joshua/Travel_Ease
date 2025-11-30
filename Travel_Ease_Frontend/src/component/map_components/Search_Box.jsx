import React, { useReducer, useRef, useEffect, useCallback } from "react";
import { endpoints } from "../../config/api.js";

// State machine for search states
const initialState = {
  status: 'idle', // idle | loading | success | error
  query: '',
  suggestions: [],
  error: null,
};

function searchReducer(state, action) {
  switch (action.type) {
    case 'SET_QUERY':
      return { ...state, query: action.payload };
    case 'FETCH_START':
      return { ...state, status: 'loading', error: null };
    case 'FETCH_SUCCESS':
      return { ...state, status: 'success', suggestions: action.payload };
    case 'FETCH_ERROR':
      return { ...state, status: 'error', error: action.payload, suggestions: [] };
    case 'CLEAR_SUGGESTIONS':
      return { ...state, suggestions: [], status: 'idle' };
    case 'RESET':
      return initialState;
    default:
      return state;
  }
}

/**
 * Normalize place from API response to internal format
 * Handles both old Nominatim format and new normalized format
 */
function normalizePlace(place) {
  // New normalized format from backend
  if (place.placeId !== undefined) {
    return {
      id: place.placeId,
      name: place.label?.split(',')[0]?.trim() || '',
      fullLabel: place.label || '',
      lat: place.coordinates?.lat,
      lng: place.coordinates?.lng,
      type: place.type,
      address: place.address,
    };
  }
  
  // Legacy Nominatim format (fallback)
  const parts = (place.display_name || '').split(',').map(p => p.trim());
  return {
    id: place.place_id?.toString(),
    name: parts[0] || '',
    fullLabel: place.display_name || '',
    lat: parseFloat(place.lat),
    lng: parseFloat(place.lon),
    type: place.type || place.class,
    address: {
      barangay: parts[1],
      city: parts[2],
      province: parts[3],
    },
  };
}

function Search_Box({ onSearch, placeholder = "Search for a place..." }) {
  const [state, dispatch] = useReducer(searchReducer, initialState);
  const boxRef = useRef(null);
  const inputRef = useRef(null);
  const debounceRef = useRef(null);
  const abortControllerRef = useRef(null);

  // Close suggestions on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (boxRef.current && !boxRef.current.contains(event.target)) {
        dispatch({ type: 'CLEAR_SUGGESTIONS' });
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearTimeout(debounceRef.current);
      abortControllerRef.current?.abort();
    };
  }, []);

  const fetchSuggestions = useCallback(async (value) => {
    // Cancel any pending request
    abortControllerRef.current?.abort();
    abortControllerRef.current = new AbortController();

    dispatch({ type: 'FETCH_START' });

    try {
      const response = await fetch(
        `${endpoints.map.suggestions}?query=${encodeURIComponent(value)}`,
        { signal: abortControllerRef.current.signal }
      );

      if (!response.ok) {
        throw new Error(response.status === 429 
          ? 'Too many requests. Please wait a moment.'
          : 'Failed to fetch suggestions');
      }

      const data = await response.json();
      // Handle both new format (suggestions array) and old format (direct array)
      const suggestions = data.suggestions || data || [];
      const normalized = suggestions.map(normalizePlace);
      
      dispatch({ type: 'FETCH_SUCCESS', payload: normalized });
    } catch (error) {
      if (error.name === 'AbortError') return; // Ignore abort errors
      console.error("Search error:", error);
      dispatch({ type: 'FETCH_ERROR', payload: error.message });
    }
  }, []);

  const handleInputChange = (e) => {
    const value = e.target.value;
    dispatch({ type: 'SET_QUERY', payload: value });

    clearTimeout(debounceRef.current);

    if (value.length < 2) {
      dispatch({ type: 'CLEAR_SUGGESTIONS' });
      return;
    }

    // Debounce: 350ms
    debounceRef.current = setTimeout(() => {
      fetchSuggestions(value);
    }, 350);
  };

  const handleSelect = (place) => {
    dispatch({ type: 'SET_QUERY', payload: place.fullLabel });
    dispatch({ type: 'CLEAR_SUGGESTIONS' });
    
    // Emit normalized place data
    onSearch({
      lat: place.lat,
      lng: place.lng,
      name: place.name,
      label: place.fullLabel,
      address: place.address,
    });
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!state.query.trim()) return;

    dispatch({ type: 'FETCH_START' });

    try {
      const response = await fetch(
        `${endpoints.map.geocode}?address=${encodeURIComponent(state.query)}`
      );

      if (!response.ok) {
        throw new Error('Location not found');
      }

      const data = await response.json();
      const place = data.place || (data[0] ? normalizePlace(data[0]) : null);

      if (place) {
        const normalized = place.placeId !== undefined ? normalizePlace(place) : place;
        onSearch({
          lat: normalized.lat || place.coordinates?.lat,
          lng: normalized.lng || place.coordinates?.lng,
          name: normalized.name || place.label?.split(',')[0],
          label: normalized.fullLabel || place.label,
        });
        dispatch({ type: 'CLEAR_SUGGESTIONS' });
      } else {
        dispatch({ type: 'FETCH_ERROR', payload: 'Location not found' });
      }
    } catch (error) {
      console.error("Search error:", error);
      dispatch({ type: 'FETCH_ERROR', payload: error.message });
    }
  };

  const handleRetry = () => {
    if (state.query.length >= 2) {
      fetchSuggestions(state.query);
    }
  };

  return (
    <div ref={boxRef} className="relative w-[300px] z-[99999]">
      <form onSubmit={handleSearch} className="flex bg-white rounded-md shadow-md z-[9999] relative">
        <input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={state.query}
          onChange={handleInputChange}
          className="p-2 w-full rounded-l-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400"
          aria-label="Search location"
          aria-autocomplete="list"
          aria-expanded={state.suggestions.length > 0}
        />
        <button
          type="submit"
          disabled={state.status === 'loading'}
          className="px-3 py-2 bg-blue-500 text-white rounded-r-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          aria-label="Search"
        >
          {state.status === 'loading' ? (
            <span className="inline-block animate-spin">&#8634;</span>
          ) : (
            '🔍'
          )}
        </button>
      </form>

      {/* Loading indicator */}
      {state.status === 'loading' && state.suggestions.length === 0 && (
        <div className="absolute top-full left-0 right-0 bg-white border border-gray-300 rounded-md p-3 shadow-md z-[100000] text-center text-gray-500">
          <span className="inline-block animate-pulse">Searching...</span>
        </div>
      )}

      {/* Error state */}
      {state.status === 'error' && (
        <div className="absolute top-full left-0 right-0 bg-white border border-red-200 rounded-md p-3 shadow-md z-[100000]">
          <div className="text-red-600 text-sm mb-2">{state.error}</div>
          <button
            onClick={handleRetry}
            className="text-blue-500 text-sm hover:underline"
          >
            Try again
          </button>
        </div>
      )}

      {/* No results */}
      {state.status === 'success' && state.suggestions.length === 0 && state.query.length >= 2 && (
        <div className="absolute top-full left-0 right-0 bg-white border border-gray-300 rounded-md p-3 shadow-md z-[100000] text-center text-gray-500">
          No places found
        </div>
      )}

      {/* Suggestions dropdown */}
      {state.suggestions.length > 0 && (
        <ul
          className="absolute top-full left-0 right-0 bg-white border border-gray-300 rounded-md max-h-60 overflow-y-auto shadow-md z-[100000]"
          role="listbox"
        >
          {state.suggestions.map((place, index) => (
            <li
              key={place.id || index}
              onClick={() => handleSelect(place)}
              className="p-3 cursor-pointer border-b border-gray-100 last:border-b-0 hover:bg-gray-50 flex items-start gap-2 transition-colors"
              role="option"
            >
              <span className="text-lg flex-shrink-0">📍</span>
              <span className="min-w-0">
                <strong className="block truncate">{place.name}</strong>
                <small className="text-gray-500 block truncate">
                  {place.fullLabel.split(',').slice(1).join(', ')}
                </small>
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default Search_Box;
