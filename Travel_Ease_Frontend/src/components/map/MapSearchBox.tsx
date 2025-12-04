import React, { useReducer, useRef, useEffect, useCallback } from "react";
import type {
  SearchResult,
  NormalizedPlace,
  SearchState,
  SearchAction,
  NominatimPlace,
} from "../../types/map";

// Tagaytay City viewbox bounds (west, north, east, south)
const TAGAYTAY_VIEWBOX = "120.92,14.15,120.97,14.07";

const initialState: SearchState = {
  status: "idle",
  query: "",
  suggestions: [],
  error: null,
};

function searchReducer(state: SearchState, action: SearchAction): SearchState {
  switch (action.type) {
    case "SET_QUERY":
      return { ...state, query: action.payload };
    case "FETCH_START":
      return { ...state, status: "loading", error: null };
    case "FETCH_SUCCESS":
      return { ...state, status: "success", suggestions: action.payload };
    case "FETCH_ERROR":
      return { ...state, status: "error", error: action.payload, suggestions: [] };
    case "CLEAR_SUGGESTIONS":
      return { ...state, suggestions: [], status: "idle" };
    case "RESET":
      return initialState;
    default:
      return state;
  }
}

function normalizeNominatimPlace(place: NominatimPlace): NormalizedPlace {
  const parts = (place.display_name || "").split(",").map((p) => p.trim());
  return {
    id: place.place_id?.toString() || "",
    name: parts[0] || "",
    fullLabel: place.display_name || "",
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

interface SearchBoxProps {
  onSearch: (result: SearchResult) => void;
  placeholder?: string;
}

export default function MapSearchBox({
  onSearch,
  placeholder = "Search for a place...",
}: SearchBoxProps): React.ReactElement {
  const [state, dispatch] = useReducer(searchReducer, initialState);
  const boxRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent): void => {
      if (boxRef.current && !boxRef.current.contains(event.target as Node)) {
        dispatch({ type: "CLEAR_SUGGESTIONS" });
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      abortControllerRef.current?.abort();
    };
  }, []);

  const fetchSuggestions = useCallback(async (query: string): Promise<void> => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = new AbortController();

    dispatch({ type: "FETCH_START" });

    try {
      // Use Nominatim API directly with viewbox for Tagaytay City
      const nominatimUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        query
      )},Tagaytay%20City&countrycodes=ph&bounded=1&viewbox=${TAGAYTAY_VIEWBOX}`;

      const response = await fetch(nominatimUrl, {
        signal: abortControllerRef.current.signal,
        headers: {
          "Accept": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(
          response.status === 429
            ? "Too many requests. Please wait a moment."
            : "Failed to fetch suggestions"
        );
      }

      const data: NominatimPlace[] = await response.json();
      const normalized = data.map(normalizeNominatimPlace);

      dispatch({ type: "FETCH_SUCCESS", payload: normalized });
    } catch (error: unknown) {
      if (error instanceof Error && error.name === "AbortError") return;
      console.error("Search error:", error);
      dispatch({
        type: "FETCH_ERROR",
        payload: error instanceof Error ? error.message : "Search failed",
      });
    }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const value = e.target.value;
    dispatch({ type: "SET_QUERY", payload: value });

    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (value.length < 2) {
      dispatch({ type: "CLEAR_SUGGESTIONS" });
      return;
    }

    debounceRef.current = setTimeout(() => {
      fetchSuggestions(value);
    }, 350);
  };

  const handleSelect = (place: NormalizedPlace): void => {
    dispatch({ type: "SET_QUERY", payload: place.fullLabel });
    dispatch({ type: "CLEAR_SUGGESTIONS" });

    onSearch({
      lat: place.lat,
      lng: place.lng,
      name: place.name,
      label: place.fullLabel,
      address: place.address,
    });
  };

  const handleSearch = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    if (!state.query.trim()) return;

    dispatch({ type: "FETCH_START" });

    try {
      // Use Nominatim API directly with viewbox for Tagaytay City
      const nominatimUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        state.query
      )},Tagaytay%20City&countrycodes=ph&bounded=1&viewbox=${TAGAYTAY_VIEWBOX}&limit=1`;

      const response = await fetch(nominatimUrl, {
        headers: {
          "Accept": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Location not found");
      }

      const data: NominatimPlace[] = await response.json();

      if (data.length > 0) {
        const place = normalizeNominatimPlace(data[0]);
        onSearch({
          lat: place.lat,
          lng: place.lng,
          name: place.name,
          label: place.fullLabel,
          address: place.address,
        });
        dispatch({ type: "CLEAR_SUGGESTIONS" });
      } else {
        dispatch({ type: "FETCH_ERROR", payload: "Location not found in Tagaytay" });
      }
    } catch (error) {
      console.error("Search error:", error);
      dispatch({
        type: "FETCH_ERROR",
        payload: error instanceof Error ? error.message : "Search failed",
      });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSearch(e as unknown as React.FormEvent);
    }
  };

  return (
    <div ref={boxRef} className="relative w-72">
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={state.query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full px-4 py-3 pr-12 bg-white/95 backdrop-blur-md border border-white/50 rounded-xl shadow-lg shadow-black/10 focus:outline-none focus:ring-2 focus:ring-primary-red focus:border-transparent text-gray-800 placeholder-gray-400"
        />
        <button
          type="button"
          onClick={handleSearch}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-gray-500 hover:text-primary-red transition-colors"
          aria-label="Search"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </button>
      </div>

      {state.status === "loading" && (
        <div className="absolute right-12 top-3.5">
          <div className="w-5 h-5 border-2 border-primary-red border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {state.suggestions.length > 0 && (
        <ul className="absolute z-50 w-full mt-2 bg-white/95 backdrop-blur-md border border-white/50 rounded-xl shadow-xl shadow-black/10 max-h-60 overflow-y-auto">
          {state.suggestions.map((place) => (
            <li
              key={place.id}
              onClick={() => handleSelect(place)}
              className="px-4 py-3 hover:bg-primary-red/10 cursor-pointer text-sm border-b border-gray-100 last:border-0 transition-colors"
            >
              <span className="font-medium text-gray-800">{place.name}</span>
              {place.fullLabel !== place.name && (
                <span className="text-gray-500 text-xs block mt-0.5 truncate">
                  {place.fullLabel}
                </span>
              )}
            </li>
          ))}
        </ul>
      )}

      {state.error && (
        <div className="absolute w-full mt-2 p-3 bg-red-50/95 backdrop-blur-md text-red-600 text-sm rounded-xl shadow-lg border border-red-100">
          {state.error}
        </div>
      )}
    </div>
  );
}
