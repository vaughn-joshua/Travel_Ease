import { useState, useMemo, useCallback } from "react";
import BusinessBox from "../../components/travel-spots/BusinessBox";
import SpotSearchBox from "../../components/travel-spots/SpotSearchBox";
import { useDebouncedValue } from "../../hooks/useDebouncedValue";
import { useTravelSpots } from "../../features/businesses/queries";

// Main categories from backend enum
const CATEGORIES = [
  { value: "accommodation", label: "Accommodation" },
  { value: "food_drinks", label: "Food & Drinks" },
  { value: "tours_activities", label: "Tours & Activities" },
  { value: "transport_transfers", label: "Transport & Transfers" },
  { value: "travel_services", label: "Travel Services" },
  { value: "shopping_souvenirs", label: "Shopping & Souvenirs" },
  { value: "wellness_medical", label: "Wellness & Medical" },
  { value: "events_experiences", label: "Events & Experiences" },
  { value: "outdoor_gear_rental", label: "Outdoor / Gear Rental" },
] as const;

// Price ranges with min/max values for filtering
const PRICE_RANGES = [
  { value: "0-100", label: "₱0 - ₱100", min: 0, max: 100 },
  { value: "100-200", label: "₱100 - ₱200", min: 100, max: 200 },
  { value: "200-400", label: "₱200 - ₱400", min: 200, max: 400 },
  { value: "400-700", label: "₱400 - ₱700", min: 400, max: 700 },
  { value: "700-1000", label: "₱700 - ₱1,000", min: 700, max: 1000 },
  { value: "1000-1500", label: "₱1,000 - ₱1,500", min: 1000, max: 1500 },
  { value: "1500+", label: "₱1,500+", min: 1500, max: Infinity },
] as const;

// Sort options
type SortOption = "default" | "price_asc" | "price_desc" | "rating_desc" | "name_asc";
const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "default", label: "Default (Rating)" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
  { value: "rating_desc", label: "Highest Rated" },
  { value: "name_asc", label: "Name: A to Z" },
];

/**
 * Filter State Machine (following state-machines.md pattern)
 * 
 * States:
 * - IDLE: No pending changes, applied filters are active
 * - PENDING: User has made changes that haven't been applied yet
 * - APPLIED: Filters have been applied (transitions back to IDLE)
 * 
 * Transitions:
 * - IDLE → PENDING: User changes category, price range, or sort option
 * - PENDING → APPLIED → IDLE: User clicks "Apply Filters"
 * - PENDING → IDLE: User clicks "Reset" (discards pending changes)
 */
type FilterState = "IDLE" | "PENDING";

export default function MainTravelSpots(): React.ReactElement {
  const [searchQuery, setSearchQuery] = useState<string>("");
  
  // Applied filters (currently active)
  const [appliedCategory, setAppliedCategory] = useState<string | null>(null);
  const [appliedPriceRange, setAppliedPriceRange] = useState<string | null>(null);
  const [appliedSortBy, setAppliedSortBy] = useState<SortOption>("default");
  
  // Pending filters (draft state - not yet applied)
  const [pendingCategory, setPendingCategory] = useState<string | null>(null);
  const [pendingPriceRange, setPendingPriceRange] = useState<string | null>(null);
  const [pendingSortBy, setPendingSortBy] = useState<SortOption>("default");

  // Determine filter state based on whether pending differs from applied
  const filterState: FilterState = useMemo(() => {
    if (
      pendingCategory !== appliedCategory ||
      pendingPriceRange !== appliedPriceRange || 
      pendingSortBy !== appliedSortBy
    ) {
      return "PENDING";
    }
    return "IDLE";
  }, [pendingCategory, appliedCategory, pendingPriceRange, appliedPriceRange, pendingSortBy, appliedSortBy]);

  const hasPendingChanges = filterState === "PENDING";

  // Debounce search input to avoid excessive API calls
  const debouncedSearch = useDebouncedValue(searchQuery, 350);

  // Use TanStack Query for fetching travel spots (using APPLIED category)
  const {
    data: travelSpotsData,
    isLoading: loading,
    isError,
    error: queryError,
    refetch,
  } = useTravelSpots({
    search: debouncedSearch || undefined,
    category: appliedCategory || undefined,
  });

  // Get the APPLIED price range bounds (used for actual filtering)
  const priceRangeBounds = useMemo(() => {
    if (!appliedPriceRange) return null;
    return PRICE_RANGES.find((pr) => pr.value === appliedPriceRange) || null;
  }, [appliedPriceRange]);

  // Filter and sort businesses using APPLIED filters (not pending)
  const businesses = useMemo(() => {
    let result = travelSpotsData?.data || [];
    
    // Apply price range filter
    if (priceRangeBounds) {
      result = result.filter((business) => {
        // If business has no price data, exclude it when filtering by price
        if (business.min_price === null && business.max_price === null) {
          return false;
        }

        const minPrice = business.min_price ?? 0;
        const maxPrice = business.max_price ?? minPrice;

        // Check if the business price range overlaps with the selected filter range
        return minPrice <= priceRangeBounds.max && maxPrice >= priceRangeBounds.min;
      });
    }

    // Apply sorting using APPLIED sort option
    if (appliedSortBy !== "default") {
      result = [...result].sort((a, b) => {
        switch (appliedSortBy) {
          case "price_asc": {
            // Sort by min_price ascending (null values go to end)
            const priceA = a.min_price ?? Infinity;
            const priceB = b.min_price ?? Infinity;
            return priceA - priceB;
          }
          case "price_desc": {
            // Sort by max_price descending (null values go to end)
            const priceA = a.max_price ?? a.min_price ?? -Infinity;
            const priceB = b.max_price ?? b.min_price ?? -Infinity;
            return priceB - priceA;
          }
          case "rating_desc": {
            // Sort by rating descending (null values go to end)
            const ratingA = a.rating ?? -Infinity;
            const ratingB = b.rating ?? -Infinity;
            return Number(ratingB) - Number(ratingA);
          }
          case "name_asc": {
            // Sort alphabetically by name
            return a.name.localeCompare(b.name);
          }
          default:
            return 0;
        }
      });
    }

    return result;
  }, [travelSpotsData?.data, priceRangeBounds, appliedSortBy]);

  const error = isError
    ? queryError?.message || "Failed to load travel spots. Please try again."
    : null;

  const handleSearch = (query: string): void => {
    setSearchQuery(query);
  };

  // Handle pending category selection (Draft state)
  const handleCategoryClick = (category: string | null) => {
    setPendingCategory(category);
  };

  // Handle pending price range selection (Draft state)
  const handlePriceClick = (priceRange: string) => {
    // Toggle selection - click again to deselect
    setPendingPriceRange((prev) => (prev === priceRange ? null : priceRange));
  };

  // Handle pending sort selection (Draft state)
  const handleSortChange = (sort: SortOption) => {
    setPendingSortBy(sort);
  };

  // State transition: PENDING → APPLIED (Apply filters)
  const applyFilters = useCallback(() => {
    setAppliedCategory(pendingCategory);
    setAppliedPriceRange(pendingPriceRange);
    setAppliedSortBy(pendingSortBy);
  }, [pendingCategory, pendingPriceRange, pendingSortBy]);

  // State transition: PENDING → IDLE (Reset to applied state)
  const resetPendingFilters = useCallback(() => {
    setPendingCategory(appliedCategory);
    setPendingPriceRange(appliedPriceRange);
    setPendingSortBy(appliedSortBy);
  }, [appliedCategory, appliedPriceRange, appliedSortBy]);

  // Clear all filters (both pending and applied)
  const clearAllFilters = useCallback(() => {
    setPendingCategory(null);
    setPendingPriceRange(null);
    setPendingSortBy("default");
    setAppliedCategory(null);
    setAppliedPriceRange(null);
    setAppliedSortBy("default");
  }, []);

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Travel Spots</h1>

        <div className="mb-6">
          <SpotSearchBox onSearch={handleSearch} />
        </div>

        {/* Filters Card (Category, Price Range, Sort) */}
        <div className={`mb-6 p-4 rounded-xl border-2 transition-all ${
          hasPendingChanges 
            ? "border-amber-400 bg-amber-50/50" 
            : "border-gray-200 bg-white"
        }`}>
          {/* Pending Changes Indicator */}
          {hasPendingChanges && (
            <div className="flex items-center gap-2 mb-4 text-amber-700">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <span className="text-sm font-medium">
                You have pending changes. Click "Apply Filters" to see results.
              </span>
            </div>
          )}

          {/* Category Filter */}
          <div className="mb-4">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Filter by Category</h3>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => handleCategoryClick(null)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  pendingCategory === null
                    ? "bg-primary-red text-white"
                    : "bg-white text-gray-700 border border-gray-300 hover:border-primary-red hover:text-primary-red"
                }`}
              >
                All Categories
              </button>
              {CATEGORIES.map((category) => (
                <button
                  key={category.value}
                  type="button"
                  onClick={() => handleCategoryClick(category.value)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    pendingCategory === category.value
                      ? "bg-primary-red text-white"
                      : "bg-white text-gray-700 border border-gray-300 hover:border-primary-red hover:text-primary-red"
                  }`}
                >
                  {category.label}
                </button>
              ))}
            </div>
          </div>

          {/* Price Filter */}
          <div className="mb-4">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Filter by Price Range</h3>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setPendingPriceRange(null)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  pendingPriceRange === null
                    ? "bg-primary-red text-white"
                    : "bg-white text-gray-700 border border-gray-300 hover:border-primary-red hover:text-primary-red"
                }`}
              >
                All Prices
              </button>
              {PRICE_RANGES.map((priceRange) => (
                <button
                  key={priceRange.value}
                  type="button"
                  onClick={() => handlePriceClick(priceRange.value)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    pendingPriceRange === priceRange.value
                      ? "bg-primary-red text-white"
                      : "bg-white text-gray-700 border border-gray-300 hover:border-primary-red hover:text-primary-red"
                  }`}
                >
                  {priceRange.label}
                </button>
              ))}
            </div>
          </div>

          {/* Sort Options */}
          <div className="mb-4 flex items-center gap-3">
            <h3 className="text-sm font-medium text-gray-700">Sort by:</h3>
            <select
              value={pendingSortBy}
              onChange={(e) => handleSortChange(e.target.value as SortOption)}
              className={`px-4 py-2 rounded-lg text-sm font-medium bg-white text-gray-700 border transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary-red focus:border-transparent ${
                pendingSortBy !== appliedSortBy
                  ? "border-amber-400"
                  : "border-gray-300 hover:border-primary-red"
              }`}
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Apply / Reset Buttons */}
          <div className="flex items-center gap-3 pt-2 border-t border-gray-200">
            <button
              type="button"
              onClick={applyFilters}
              disabled={!hasPendingChanges}
              className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                hasPendingChanges
                  ? "bg-primary-red text-white hover:bg-red-700 shadow-md hover:shadow-lg"
                  : "bg-gray-200 text-gray-400 cursor-not-allowed"
              }`}
            >
              Apply Filters
            </button>
            {hasPendingChanges && (
              <button
                type="button"
                onClick={resetPendingFilters}
                className="px-4 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-100 transition-colors"
              >
                Reset
              </button>
            )}
            {(appliedCategory || appliedPriceRange || appliedSortBy !== "default") && (
              <button
                type="button"
                onClick={clearAllFilters}
                className="ml-auto px-4 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 transition-colors"
              >
                Clear All Filters
              </button>
            )}
          </div>

          {/* Active Filters Summary */}
          {(appliedCategory || appliedPriceRange || appliedSortBy !== "default") && (
            <div className="mt-3 pt-3 border-t border-gray-200">
              <p className="text-xs text-gray-500 mb-2">Currently applied:</p>
              <div className="flex flex-wrap gap-2">
                {appliedCategory && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                    Category: {CATEGORIES.find(c => c.value === appliedCategory)?.label}
                  </span>
                )}
                {appliedPriceRange && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-primary-red/10 text-primary-red">
                    Price: {PRICE_RANGES.find(p => p.value === appliedPriceRange)?.label}
                  </span>
                )}
                {appliedSortBy !== "default" && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                    Sort: {SORT_OPTIONS.find(s => s.value === appliedSortBy)?.label}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-b-2 border-primary-red" />
              <p className="text-gray-600">Loading travel spots...</p>
            </div>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-600 mb-4">{error}</p>
            <button onClick={() => refetch()} className="btn-primary">
              Retry
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {businesses.length === 0 ? (
              <div className="col-span-full text-center py-8">
                <p className="text-gray-500">
                  {appliedCategory && appliedPriceRange
                    ? `No travel spots found in "${CATEGORIES.find(c => c.value === appliedCategory)?.label || appliedCategory}" with price range ${PRICE_RANGES.find(p => p.value === appliedPriceRange)?.label}`
                    : appliedCategory
                    ? `No travel spots found in "${CATEGORIES.find(c => c.value === appliedCategory)?.label || appliedCategory}" category`
                    : appliedPriceRange
                    ? `No travel spots found in price range ${PRICE_RANGES.find(p => p.value === appliedPriceRange)?.label}`
                    : "No travel spots found"}
                </p>
                {(appliedCategory || appliedPriceRange || appliedSortBy !== "default") && (
                  <button
                    onClick={clearAllFilters}
                    className="mt-4 text-primary-red hover:underline text-sm font-medium"
                  >
                    Clear all filters
                  </button>
                )}
              </div>
            ) : (
              businesses.map((business) => (
                <BusinessBox key={business.business_id} business={business} />
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
