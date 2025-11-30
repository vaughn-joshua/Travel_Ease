import React, { useReducer, useRef, useEffect, useCallback } from "react";
import { endpoints } from "../../config/api";
import type {
  SearchResult,
  NormalizedPlace,
  SearchState,
  SearchAction,
  BackendPlace,
  NominatimPlace,
} from "../../types/map";

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

function normalizePlace(place: BackendPlace | NominatimPlace): NormalizedPlace {
  if ("placeId" in place) {
    return {
      id: place.placeId,
      name: place.label?.split(",")[0]?.trim() || "",
      fullLabel: place.label || "",
      lat: place.coordinates?.lat || 0,
      lng: place.coordinates?.lng || 0,
      type: place.type,
      address: place.address,
    };
  }

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

export default function Search_Box({
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

  const fetchSuggestions = useCallback(async (value: string): Promise<void> => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = new AbortController();

    dispatch({ type: "FETCH_START" });

    try {
      const response = await fetch(
        `${endpoints.map.suggestions}?query=${encodeURIComponent(value)}`,
        { signal: abortControllerRef.current.signal }
      );

      if (!response.ok) {
        throw new Error(
          response.status === 429
            ? "Too many requests. Please wait a moment."
            : "Failed to fetch suggestions"
        );
      }

      const data = await response.json();
      const suggestions = data.suggestions || data || [];
      const normalized = suggestions.map(normalizePlace);

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
      const response = await fetch(
        `${endpoints.map.geocode}?address=${encodeURIComponent(state.query)}`
      );

      if (!response.ok) {
        throw new Error("Location not found");
      }

      const data = await response.json();
      const place = data.place || (data[0] ? normalizePlace(data[0]) : null);

      if (place) {
        const normalized = "placeId" in place ? normalizePlace(place) : place;
        onSearch({
          lat: normalized.lat || place.coordinates?.lat,
          lng: normalized.lng || place.coordinates?.lng,
          name: normalized.name || place.label?.split(",")[0],
          label: normalized.fullLabel || place.label,
        });
        dispatch({ type: "CLEAR_SUGGESTIONS" });
      } else {
        dispatch({ type: "FETCH_ERROR", payload: "Location not found" });
      }
    } catch (error) {
      console.error("Search error:", error);
      dispatch({
        type: "FETCH_ERROR",
        payload: error instanceof Error ? error.message : "Search failed",
      });
    }
  };

  return (
    <div ref={boxRef} className="relative w-64">
      <form onSubmit={handleSearch}>
        <input
          ref={inputRef}
          type="text"
          value={state.query}
          onChange={handleInputChange}
          placeholder={placeholder}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500"
        />
      </form>

      {state.status === "loading" && (
        <div className="absolute right-3 top-2.5">
          <div className="w-5 h-5 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {state.suggestions.length > 0 && (
        <ul className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {state.suggestions.map((place) => (
            <li
              key={place.id}
              onClick={() => handleSelect(place)}
              className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm"
            >
              <span className="font-medium">{place.name}</span>
              {place.fullLabel !== place.name && (
                <span className="text-gray-500 text-xs block">
                  {place.fullLabel}
                </span>
              )}
            </li>
          ))}
        </ul>
      )}

      {state.error && (
        <div className="absolute w-full mt-1 p-2 bg-red-50 text-red-600 text-sm rounded-lg">
          {state.error}
        </div>
      )}
    </div>
  );
}

