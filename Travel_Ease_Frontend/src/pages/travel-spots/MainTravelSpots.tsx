import { useState } from "react";
import BusinessBox from "../../components/travel-spots/BusinessBox";
import SpotSearchBox from "../../components/travel-spots/SpotSearchBox";
import { useDebouncedValue } from "../../hooks/useDebouncedValue";
import { useTravelSpots } from "../../features/businesses/queries";

// Categories from backend enum
const CATEGORIES = [
  { value: "food", label: "Food" },
  { value: "drinks", label: "Drinks" },
  { value: "accomodation", label: "Accommodation" },
  { value: "souvenir shop", label: "Souvenir Shop" },
  { value: "nature", label: "Nature" },
  { value: "night life", label: "Night Life" },
  { value: "leisure", label: "Leisure" },
  { value: "activities", label: "Activities" },
  { value: "local offers", label: "Local Offers" },
] as const;

// Price ranges from backend enum (UI only for now)
const PRICE_RANGES = [
  { value: "0-100", label: "₱0 - ₱100" },
  { value: "100-200", label: "₱100 - ₱200" },
  { value: "200-400", label: "₱200 - ₱400" },
  { value: "400-700", label: "₱400 - ₱700" },
  { value: "700-1000", label: "₱700 - ₱1,000" },
  { value: "1000-1500", label: "₱1,000 - ₱1,500" },
  { value: "1500+", label: "₱1,500+" },
] as const;

export default function MainTravelSpots(): React.ReactElement {
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedPriceRange, setSelectedPriceRange] = useState<string | null>(null);
  const [showPriceTooltip, setShowPriceTooltip] = useState(false);

  // Debounce search input to avoid excessive API calls
  const debouncedSearch = useDebouncedValue(searchQuery, 350);

  // Use TanStack Query for fetching travel spots
  const {
    data: travelSpotsData,
    isLoading: loading,
    isError,
    error: queryError,
    refetch,
  } = useTravelSpots({
    search: debouncedSearch || undefined,
    category: selectedCategory || undefined,
  });

  const businesses = travelSpotsData?.data || [];
  const error = isError
    ? queryError?.message || "Failed to load travel spots. Please try again."
    : null;

  const handleSearch = (query: string): void => {
    setSearchQuery(query);
  };

  const handleCategoryClick = (category: string | null) => {
    setSelectedCategory(category);
  };

  const handlePriceClick = (priceRange: string) => {
    // Price filtering is not yet implemented - show tooltip
    setSelectedPriceRange(priceRange);
    setShowPriceTooltip(true);
    setTimeout(() => setShowPriceTooltip(false), 2000);
    // Reset selection since it doesn't work yet
    setTimeout(() => setSelectedPriceRange(null), 100);
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Travel Spots</h1>

        <div className="mb-6">
          <SpotSearchBox onSearch={handleSearch} />
        </div>

        {/* Category Filter */}
        <div className="mb-4">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Filter by Category</h3>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => handleCategoryClick(null)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                selectedCategory === null
                  ? "bg-primary-red text-white"
                  : "bg-white text-gray-700 border border-gray-300 hover:border-primary-red hover:text-primary-red"
              }`}
            >
              All
            </button>
            {CATEGORIES.map((category) => (
              <button
                key={category.value}
                type="button"
                onClick={() => handleCategoryClick(category.value)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  selectedCategory === category.value
                    ? "bg-primary-red text-white"
                    : "bg-white text-gray-700 border border-gray-300 hover:border-primary-red hover:text-primary-red"
                }`}
              >
                {category.label}
              </button>
            ))}
          </div>
        </div>

        {/* Price Filter (UI only - not functional yet) */}
        <div className="mb-6 relative">
          <h3 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
            Filter by Price Range
            <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded">Coming Soon</span>
          </h3>
          <div className="flex flex-wrap gap-2">
            {PRICE_RANGES.map((priceRange) => (
              <button
                key={priceRange.value}
                type="button"
                onClick={() => handlePriceClick(priceRange.value)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors cursor-not-allowed opacity-60 ${
                  selectedPriceRange === priceRange.value
                    ? "bg-gray-400 text-white"
                    : "bg-white text-gray-500 border border-gray-200"
                }`}
              >
                {priceRange.label}
              </button>
            ))}
          </div>
          {/* Tooltip for price filter */}
          {showPriceTooltip && (
            <div className="absolute top-full left-0 mt-2 px-3 py-2 bg-gray-800 text-white text-sm rounded-lg shadow-lg z-10 animate-fade-in">
              Price filtering coming soon!
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
              <p className="text-gray-500 col-span-full text-center">
                {selectedCategory
                  ? `No travel spots found in "${CATEGORIES.find(c => c.value === selectedCategory)?.label || selectedCategory}" category`
                  : "No travel spots found"}
              </p>
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
