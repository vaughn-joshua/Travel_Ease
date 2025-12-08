import React, { useState, useRef, useEffect, useMemo } from "react";
import {
  useNominatimSearch,
  useNominatimGeocode,
  useDatabaseBusinessSearch,
} from "../../features/map/queries";
import { useDebouncedValue } from "../../hooks/useDebouncedValue";
import type { SearchResult, NormalizedPlace } from "../../types/map";

interface SearchBoxProps {
  onSearch: (result: SearchResult) => void;
  onAddToPlan?: (result: SearchResult) => void; // Optional callback for "Add to Travel Plan"
  placeholder?: string;
  initialValue?: string;
}

export default function MapSearchBox({
  onSearch,
  onAddToPlan,
  placeholder = "Search for a place...",
  initialValue = "",
}: SearchBoxProps): React.ReactElement {
  const [query, setQuery] = useState(initialValue);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchOnEnter, setSearchOnEnter] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Debounce the query for autocomplete (350ms delay)
  const debouncedQuery = useDebouncedValue(query, 350);

  // Use TanStack Query for database business search
  const {
    data: dbResults = [],
    isLoading: isDbLoading,
    isError: isDbError,
    error: dbError,
  } = useDatabaseBusinessSearch(debouncedQuery);

  // Use TanStack Query for cached search suggestions from Nominatim
  const {
    data: nominatimResults = [],
    isLoading: isNominatimLoading,
    isError: isNominatimError,
    error: nominatimError,
  } = useNominatimSearch(debouncedQuery);

  // Combine results: database results first, then Nominatim results
  const suggestions = useMemo(() => {
    return [...dbResults, ...nominatimResults];
  }, [dbResults, nominatimResults]);

  // Update showSuggestions when suggestions change
  useEffect(() => {
    if (query.length >= 2 && suggestions.length > 0) {
      setShowSuggestions(true);
    } else if (query.length < 2) {
      setShowSuggestions(false);
    }
  }, [suggestions, query]);

  // Use TanStack Query for direct geocode search (on Enter)
  const {
    data: geocodeResult,
    isLoading: isGeocodeLoading,
    isError: isGeocodeError,
    error: geocodeError,
  } = useNominatimGeocode(searchOnEnter ? query : "");

  // Handle geocode result when user presses Enter
  useEffect(() => {
    if (searchOnEnter && geocodeResult) {
      onSearch({
        lat: geocodeResult.lat,
        lng: geocodeResult.lng,
        name: geocodeResult.name,
        label: geocodeResult.fullLabel,
        address: geocodeResult.address,
      });
      setShowSuggestions(false);
      setSearchOnEnter(false);
    }
  }, [geocodeResult, searchOnEnter, onSearch]);

  // Handle click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent): void => {
      if (boxRef.current && !boxRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const value = e.target.value;
    setQuery(value);
    // Show suggestions dropdown when there are results and query is at least 2 chars
    setShowSuggestions(value.length >= 2 && suggestions.length > 0);
    setSearchOnEnter(false);
  };

  const handleSelect = (place: NormalizedPlace): void => {
    setQuery(place.fullLabel);
    setShowSuggestions(false);

    onSearch({
      lat: place.lat,
      lng: place.lng,
      name: place.name,
      label: place.fullLabel,
      address: place.address,
    });
  };

  const handleSearch = (e: React.FormEvent): void => {
    e.preventDefault();
    if (!query.trim()) return;

    // If there are suggestions available, use the first one
    if (suggestions.length > 0) {
      handleSelect(suggestions[0]);
      return;
    }

    // Otherwise trigger a geocode search
    setSearchOnEnter(true);
    setShowSuggestions(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSearch(e as unknown as React.FormEvent);
    }
  };

  const isLoading = isDbLoading || isNominatimLoading || isGeocodeLoading;
  const hasError =
    (isDbError && query.length >= 2) ||
    (isNominatimError && query.length >= 2) ||
    (isGeocodeError && searchOnEnter);
  const errorMessage =
    dbError?.message || nominatimError?.message || geocodeError?.message || "Search failed";

  return (
    <div ref={boxRef} className="relative w-72 z-[10000]">
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={query}
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
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </button>
      </div>

      {isLoading && (
        <div className="absolute right-12 top-3.5">
          <div className="w-5 h-5 border-2 border-primary-red border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {showSuggestions && query.length >= 2 && suggestions.length > 0 && (
        <ul className="absolute z-[9999] w-full mt-2 bg-white/95 backdrop-blur-md border border-white/50 rounded-xl shadow-xl shadow-black/10 max-h-60 overflow-y-auto">
          {suggestions.map((place) => {
            const isDatabaseResult = place.id.startsWith("business_");
            return (
              <li
                key={place.id}
                className="border-b border-gray-100 last:border-0"
              >
                <div
                  onClick={() => handleSelect(place)}
                  className="px-4 py-3 hover:bg-primary-red/10 cursor-pointer text-sm transition-colors"
                >
                  <div className="flex items-center gap-2">
                    {isDatabaseResult && (
                      <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-medium">
                        🏢 DB
                      </span>
                    )}
                    <span className="font-medium text-gray-800 flex-1">{place.name}</span>
                  </div>
                  {place.fullLabel !== place.name && (
                    <span className="text-gray-500 text-xs block mt-0.5 truncate">
                      {place.fullLabel}
                    </span>
                  )}
                </div>
                {/* Add to Travel Plan button for selected search results */}
                {onAddToPlan && (
                  <div className="px-4 pb-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        // Convert place to SearchResult and trigger add to plan
                        const searchResult: SearchResult = {
                          lat: place.lat,
                          lng: place.lng,
                          name: place.name,
                          label: place.fullLabel,
                          address: place.address,
                          business_id: isDatabaseResult ? parseInt(place.id.replace("business_", "")) : undefined,
                        };
                        onAddToPlan(searchResult);
                      }}
                      className="w-full text-xs text-primary-red hover:text-primary-red/80 hover:bg-red-50 py-1.5 px-2 rounded transition-colors flex items-center justify-center gap-1"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      Add to Travel Plan
                    </button>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {hasError && (
        <div className="absolute w-full mt-2 p-3 bg-red-50/95 backdrop-blur-md text-red-600 text-sm rounded-xl shadow-lg border border-red-100">
          {errorMessage}
        </div>
      )}
    </div>
  );
}
