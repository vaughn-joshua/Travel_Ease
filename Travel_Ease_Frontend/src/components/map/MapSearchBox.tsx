import React, { useState, useRef, useEffect, useMemo, useCallback } from "react";
import {
  useNominatimSearch,
  useNominatimGeocode,
  useDatabaseBusinessSearch,
} from "../../features/map/queries";
import { useDebouncedValue } from "../../hooks/useDebouncedValue";
import type { SearchResult, NormalizedPlace } from "../../types/map";

interface SearchBoxProps {
  onSearch: (result: SearchResult) => void;
  onAddToPlan?: (result: SearchResult) => void;
  placeholder?: string;
  initialValue?: string;
}

export default function MapSearchBox({
  onSearch,
  onAddToPlan,
  placeholder = "Search places, businesses...",
  initialValue = "",
}: SearchBoxProps): React.ReactElement {
  const [query, setQuery] = useState(initialValue);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchOnEnter, setSearchOnEnter] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const boxRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

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

  // Reset highlighted index when suggestions change
  useEffect(() => {
    setHighlightedIndex(-1);
  }, [suggestions]);

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
    setShowSuggestions(value.length >= 2 && suggestions.length > 0);
    setSearchOnEnter(false);
  };

  const handleSelect = useCallback((place: NormalizedPlace): void => {
    setQuery(place.fullLabel);
    setShowSuggestions(false);

    onSearch({
      lat: place.lat,
      lng: place.lng,
      name: place.name,
      label: place.fullLabel,
      address: place.address,
    });
  }, [onSearch]);

  const handleSearch = (e: React.FormEvent): void => {
    e.preventDefault();
    if (!query.trim()) return;

    // If there's a highlighted suggestion, use it
    if (highlightedIndex >= 0 && highlightedIndex < suggestions.length) {
      handleSelect(suggestions[highlightedIndex]);
      return;
    }

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
    if (!showSuggestions || suggestions.length === 0) {
      if (e.key === "Enter") {
        e.preventDefault();
        handleSearch(e as unknown as React.FormEvent);
      }
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setHighlightedIndex((prev) => 
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case "Enter":
        e.preventDefault();
        if (highlightedIndex >= 0) {
          handleSelect(suggestions[highlightedIndex]);
        } else {
          handleSearch(e as unknown as React.FormEvent);
        }
        break;
      case "Escape":
        setShowSuggestions(false);
        setHighlightedIndex(-1);
        break;
    }
  };

  // Scroll highlighted item into view
  useEffect(() => {
    if (highlightedIndex >= 0 && listRef.current) {
      const item = listRef.current.children[highlightedIndex] as HTMLElement;
      if (item) {
        item.scrollIntoView({ block: "nearest" });
      }
    }
  }, [highlightedIndex]);

  const isLoading = isDbLoading || isNominatimLoading || isGeocodeLoading;
  const hasError =
    (isDbError && query.length >= 2) ||
    (isNominatimError && query.length >= 2) ||
    (isGeocodeError && searchOnEnter);
  const errorMessage =
    dbError?.message || nominatimError?.message || geocodeError?.message || "Search failed";

  // Get icon for place type
  const getPlaceIcon = (place: NormalizedPlace) => {
    const isDatabaseResult = place.id.startsWith("business_");
    if (isDatabaseResult) {
      return (
        <div className="w-8 h-8 rounded-lg bg-primary-red/10 flex items-center justify-center flex-shrink-0">
          <svg className="w-4 h-4 text-primary-red" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        </div>
      );
    }
    return (
      <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
        <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </div>
    );
  };

  return (
    <div ref={boxRef} className="relative w-full z-[10000]">
      <form onSubmit={handleSearch} className="relative">
        {/* Search input with glass effect */}
        <div className="relative group">
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={() => query.length >= 2 && suggestions.length > 0 && setShowSuggestions(true)}
            placeholder={placeholder}
            aria-label="Search for places"
            aria-expanded={showSuggestions}
            aria-haspopup="listbox"
            aria-autocomplete="list"
            aria-controls="search-suggestions"
            className="
              w-full pl-4 pr-12 py-3
              bg-white/95 backdrop-blur-xl
              border border-white/60
              rounded-xl
              shadow-lg shadow-black/10
              text-sm text-gray-800 placeholder-gray-400
              transition-all duration-200
              focus:outline-none focus:ring-2 focus:ring-primary-red/50 focus:border-primary-red/30
              focus:shadow-xl focus:shadow-primary-red/10
              group-hover:shadow-xl
            "
          />
          
          {/* Search/Loading button */}
          <button
            type="submit"
            disabled={isLoading}
            className="
              absolute right-2 top-1/2 -translate-y-1/2
              w-8 h-8 rounded-lg
              flex items-center justify-center
              text-gray-400 hover:text-primary-red hover:bg-primary-red/10
              transition-all duration-200
              focus:outline-none focus:ring-2 focus:ring-primary-red/50
              disabled:opacity-50
            "
            aria-label={isLoading ? "Searching..." : "Search"}
          >
            {isLoading ? (
              <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            )}
          </button>
        </div>

        {/* Status indicator below input */}
        {isLoading && query.length >= 2 && (
          <div className="absolute -bottom-6 left-0 right-0 text-center">
            <span className="text-xs text-gray-500 bg-white/80 px-2 py-0.5 rounded-full">
              Searching...
            </span>
          </div>
        )}
      </form>

      {/* Suggestions dropdown */}
      {showSuggestions && query.length >= 2 && suggestions.length > 0 && (
        <ul
          ref={listRef}
          id="search-suggestions"
          role="listbox"
          className="
            absolute z-[9999] w-full mt-2
            bg-white/98 backdrop-blur-xl
            border border-gray-200/60
            rounded-xl
            shadow-2xl shadow-black/15
            max-h-72 overflow-y-auto
            divide-y divide-gray-100
          "
        >
          {/* Results count header */}
          <li className="px-4 py-2 bg-gray-50/80 text-xs text-gray-500 sticky top-0 flex items-center justify-between">
            <span>{suggestions.length} result{suggestions.length !== 1 ? 's' : ''}</span>
            <span className="text-gray-400">↑↓ to navigate, Enter to select</span>
          </li>
          
          {suggestions.map((place, index) => {
            const isDatabaseResult = place.id.startsWith("business_");
            const isHighlighted = index === highlightedIndex;
            
            return (
              <li
                key={place.id}
                role="option"
                aria-selected={isHighlighted}
                className={`
                  transition-colors duration-100
                  ${isHighlighted ? "bg-primary-red/10" : "hover:bg-gray-50"}
                `}
              >
                <div
                  onClick={() => handleSelect(place)}
                  className="px-4 py-3 cursor-pointer"
                >
                  <div className="flex items-start gap-3">
                    {getPlaceIcon(place)}
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`font-medium text-sm line-clamp-1 ${isHighlighted ? "text-primary-red" : "text-gray-800"}`}>
                          {place.name}
                        </span>
                        {isDatabaseResult && (
                          <span className="px-1.5 py-0.5 bg-primary-red/10 text-primary-red text-[10px] font-semibold rounded-md uppercase tracking-wide">
                            Local
                          </span>
                        )}
                      </div>
                      {place.fullLabel !== place.name && (
                        <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">
                          {place.fullLabel}
                        </p>
                      )}
                    </div>

                    {/* Quick add button */}
                    {onAddToPlan && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
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
                        className="
                          flex-shrink-0 p-2 rounded-lg
                          text-gray-400 hover:text-primary-red hover:bg-primary-red/10
                          transition-colors
                          focus:outline-none focus:ring-2 focus:ring-primary-red/50
                        "
                        title="Add to travel plan"
                        aria-label={`Add ${place.name} to travel plan`}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {/* No results state */}
      {showSuggestions && query.length >= 2 && suggestions.length === 0 && !isLoading && !hasError && (
        <div className="absolute z-[9999] w-full mt-2 p-4 bg-white/98 backdrop-blur-xl rounded-xl shadow-xl border border-gray-200/60 text-center">
          <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-2">
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-sm text-gray-600 font-medium">No places found</p>
          <p className="text-xs text-gray-400 mt-1">Try a different search term</p>
        </div>
      )}

      {/* Error state */}
      {hasError && (
        <div className="absolute z-[9999] w-full mt-2 p-4 bg-red-50/98 backdrop-blur-xl rounded-xl shadow-xl border border-red-200/60">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-red-700 font-medium">Search failed</p>
              <p className="text-xs text-red-500 mt-0.5">{errorMessage}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
