import { useState, useMemo } from "react";
import SpotCard from "../../components/travel-spots/SpotCard";
import SpotSearchBox from "../../components/travel-spots/SpotSearchBox";
import FilterSidebar from "../../components/travel-spots/FilterSidebar";
import ResultsHeader from "../../components/travel-spots/ResultsHeader";
import Pagination from "../../components/travel-spots/Pagination";
import { useDebouncedValue } from "../../hooks/useDebouncedValue";
import { useTravelSpots } from "../../features/businesses/queries";
import {
  PRICE_SLIDER_MIN,
  PRICE_SLIDER_MAX,
  type SortOption,
} from "../../components/travel-spots/constants";
import { useAuth } from "../../context/AuthContext";

const ITEMS_PER_PAGE = 12;
const DEFAULT_PRICE: [number, number] = [PRICE_SLIDER_MIN, PRICE_SLIDER_MAX];

export default function MainTravelSpots(): React.ReactElement {
  const { user } = useAuth();
  const isLoggedIn = Boolean(user);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  const [searchQuery, setSearchQuery] = useState<string>("");
  const [category, setCategory] = useState<string | null>(null);
  const [priceRange, setPriceRange] = useState<[number, number]>(DEFAULT_PRICE);
  const [sortBy, setSortBy] = useState<SortOption>("default");
  const [currentPage, setCurrentPage] = useState(1);

  const debouncedSearch = useDebouncedValue(searchQuery, 350);

  const {
    data: travelSpotsData,
    isLoading: loading,
    isError,
    error: queryError,
    refetch,
  } = useTravelSpots({
    search: debouncedSearch || undefined,
    category: category || undefined,
  });

  const isPriceFiltered =
    priceRange[0] !== PRICE_SLIDER_MIN || priceRange[1] !== PRICE_SLIDER_MAX;

  const processedBusinesses = useMemo(() => {
    let result = travelSpotsData?.data || [];

    if (isPriceFiltered) {
      result = result.filter((business) => {
        if (business.min_price === null && business.max_price === null)
          return false;
        const minPrice = business.min_price ?? 0;
        const maxPrice = business.max_price ?? minPrice;
        return minPrice <= priceRange[1] && maxPrice >= priceRange[0];
      });
    }

    if (sortBy !== "default") {
      result = [...result].sort((a, b) => {
        switch (sortBy) {
          case "price_asc": {
            const priceA = a.min_price ?? Infinity;
            const priceB = b.min_price ?? Infinity;
            return priceA - priceB;
          }
          case "price_desc": {
            const priceA = a.max_price ?? a.min_price ?? -Infinity;
            const priceB = b.max_price ?? b.min_price ?? -Infinity;
            return priceB - priceA;
          }
          case "rating_desc": {
            const ratingA = a.rating ?? -Infinity;
            const ratingB = b.rating ?? -Infinity;
            return Number(ratingB) - Number(ratingA);
          }
          case "name_asc":
            return a.name.localeCompare(b.name);
          default:
            return 0;
        }
      });
    }

    return result;
  }, [travelSpotsData?.data, priceRange, isPriceFiltered, sortBy]);

  const totalItems = processedBusinesses.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / ITEMS_PER_PAGE));
  const currentBusinesses = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return processedBusinesses.slice(start, start + ITEMS_PER_PAGE);
  }, [processedBusinesses, currentPage]);

  const error = isError
    ? queryError?.message || "Failed to load travel spots. Please try again."
    : null;

  const handleSearch = (query: string): void => {
    setSearchQuery(query);
    setCurrentPage(1);
  };

  const handleCategoryChange = (newCategory: string | null) => {
    setCategory(newCategory);
    setCurrentPage(1);
  };

  const handlePriceRangeChange = (range: [number, number]) => {
    setPriceRange(range);
    setCurrentPage(1);
  };

  const handleSortChange = (newSort: SortOption) => {
    setSortBy(newSort);
    setCurrentPage(1);
  };

  const clearAllFilters = () => {
    setCategory(null);
    setPriceRange(DEFAULT_PRICE);
    setSortBy("default");
    setCurrentPage(1);
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {isLoggedIn ? (
        <div className="border-b border-gray-200 bg-white">
          <div className="mx-auto w-full max-w-[1800px] px-4 py-6 sm:px-6 lg:px-8">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Explore Travel Spots
            </h1>
            <p className="mt-2 text-lg text-gray-600">
              Find the perfect places to stay, eat, and explore for your next
              adventure.
            </p>
            <div className="mt-5 w-full">
              <SpotSearchBox onSearch={handleSearch} />
            </div>
          </div>
        </div>
      ) : (
        <section className="relative h-[88vh] min-h-[680px] w-full overflow-hidden">
          <div className="absolute inset-0">
            <img
              src="https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?auto=format&fit=crop&w=2400&q=80"
              alt="Tagaytay scenic sites"
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/70" />
          </div>

          <div className="relative flex h-full items-center justify-center px-4 text-center sm:px-6 lg:px-8">
            <div className="max-w-4xl space-y-8">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-4 py-1.5 backdrop-blur-md">
                <span className="h-2 w-2 rounded-full bg-primary-red" />
                <span className="text-sm font-medium uppercase tracking-wide text-white">
                  TravelEase Spots
                </span>
              </div>

              <h1 className="text-4xl font-extrabold tracking-tight text-white drop-shadow-lg sm:text-5xl lg:text-7xl">
                Discover Tagaytay,
                <br className="hidden sm:block" />
                <span className="bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                  One Spot at a Time
                </span>
              </h1>

              <p className="mx-auto max-w-2xl text-lg leading-relaxed text-gray-200 drop-shadow-md sm:text-xl">
                Explore top restaurants, attractions, stays, and hidden local
                gems curated for your next trip.
              </p>
            </div>
          </div>
        </section>
      )}

      <div className="mx-auto w-full max-w-[1800px] px-4 pt-6 sm:px-6 lg:px-8">
        {!isLoggedIn && (
          <div className="sticky top-16 z-30 mb-8 border-b border-gray-200 bg-gray-50/95 pb-6 pt-2 backdrop-blur">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl lg:text-5xl">
              Explore Travel Spots
            </h2>
            <p className="mt-2 text-gray-600">
              Browse curated places around Tagaytay using filters to find your
              next stop.
            </p>
          </div>
        )}

        <div className="flex flex-col lg:flex-row lg:gap-8">
          {/* Desktop sticky sidebar */}
          <div className="hidden lg:block lg:w-72 lg:shrink-0">
            <div className="sticky top-20">
              <FilterSidebar
                category={category}
                onCategoryChange={handleCategoryChange}
                priceRange={priceRange}
                onPriceRangeChange={handlePriceRangeChange}
                isDesktop
              />
            </div>
          </div>

          {/* Mobile filter drawer */}
          <div className="lg:hidden">
            <FilterSidebar
              category={category}
              onCategoryChange={handleCategoryChange}
              priceRange={priceRange}
              onPriceRangeChange={handlePriceRangeChange}
              isOpenMobile={isMobileFilterOpen}
              onCloseMobile={() => setIsMobileFilterOpen(false)}
            />
          </div>

          {/* Main content */}
          <div className="flex-1 min-w-0 pt-6 lg:pt-0">
            {isLoggedIn ? (
              <ResultsHeader
                totalCount={totalItems}
                category={category}
                onClearCategory={() => handleCategoryChange(null)}
                priceRange={priceRange}
                isPriceFiltered={isPriceFiltered}
                onClearPriceRange={() => handlePriceRangeChange(DEFAULT_PRICE)}
                sortBy={sortBy}
                onSortChange={handleSortChange}
                onMobileFilterClick={() => setIsMobileFilterOpen(true)}
                onClearAll={clearAllFilters}
              />
            ) : (
              <div className="mb-6 flex items-center justify-between gap-4">
                <h2 className="text-lg font-semibold text-gray-900">
                  {totalItems} {totalItems === 1 ? "Spot" : "Spots"} Available
                </h2>
                <button
                  onClick={() => setIsMobileFilterOpen(true)}
                  className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-red lg:hidden"
                  aria-label="Open filters"
                >
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                    />
                  </svg>
                  Filters
                </button>
              </div>
            )}

            {loading ? (
              <div className="flex min-h-[400px] flex-col items-center justify-center">
                <div className="mb-4 h-10 w-10 animate-spin rounded-full border-b-2 border-primary-red" />
                <p className="text-gray-500">Loading travel spots…</p>
              </div>
            ) : error ? (
              <div className="flex min-h-[400px] flex-col items-center justify-center py-12 text-center">
                <p className="mb-4 text-red-600">{error}</p>
                <button
                  onClick={() => refetch()}
                  className="rounded-lg bg-primary-red px-6 py-2.5 font-medium text-white transition-colors hover:bg-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-red focus-visible:ring-offset-2"
                >
                  Retry
                </button>
              </div>
            ) : currentBusinesses.length === 0 ? (
              <div className="flex min-h-[400px] flex-col items-center justify-center py-12 text-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
                  <svg
                    className="h-8 w-8 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </div>
                <h3 className="mb-1 text-lg font-medium text-gray-900">
                  No spots found
                </h3>
                <p className="mb-6 text-gray-500">
                  Try adjusting your filters or search term to find what you're
                  looking for.
                </p>
                {(category || isPriceFiltered || searchQuery) && (
                  <button
                    onClick={clearAllFilters}
                    className="text-sm font-medium text-primary-red hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-red rounded"
                  >
                    Clear all filters
                  </button>
                )}
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {currentBusinesses.map((business) => (
                    <SpotCard key={business.business_id} business={business} />
                  ))}
                </div>

                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                />
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
