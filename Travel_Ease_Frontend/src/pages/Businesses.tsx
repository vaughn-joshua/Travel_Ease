import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import BusinessCard, { Business } from "../components/business/BusinessCard";
import BusinessFilterBar from "../components/business/BusinessFilterBar";
import {
  useBusinessList,
  useBusinessCategories,
} from "../features/businesses/queries";
import { Loader2 } from "lucide-react";
import Button from "../components/ui/Button";

const PRICE_RANGES: Record<string, { min: number; max: number }> = {
  budget: { min: 0, max: 200 },
  mid: { min: 200, max: 500 },
  premium: { min: 500, max: 10000 },
};

interface FilterState {
  category: string | null;
  priceRange: string | null;
  search: string;
}

export default function Businesses() {
  const [filters, setFilters] = useState<FilterState>({
    category: null,
    priceRange: null,
    search: "",
  });
  const [page, setPage] = useState(1);

  // Use TanStack Query for categories
  const { data: categoriesData } = useBusinessCategories();
  const categories = categoriesData?.categories || [];

  // Build query params for business list
  const queryParams = {
    page,
    pageSize: 12,
    category: filters.category || undefined,
    search: filters.search || undefined,
    ...(filters.priceRange && PRICE_RANGES[filters.priceRange]
      ? {
          minPrice: PRICE_RANGES[filters.priceRange].min,
          maxPrice: PRICE_RANGES[filters.priceRange].max,
        }
      : {}),
  };

  // Use TanStack Query for business list
  const {
    data: businessData,
    isLoading: loading,
    isError,
    error: queryError,
    refetch,
  } = useBusinessList(queryParams);

  const businesses: Business[] = businessData?.items || [];
  const totalPages = businessData?.totalPages || 1;
  const total = businessData?.total || 0;
  const error = isError
    ? queryError?.message ||
      "Failed to load businesses. Please try again later."
    : null;

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [filters]);

  const handleFilterChange = (newFilters: FilterState) => {
    setFilters(newFilters);
  };

  if (error && !loading && businesses.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md text-center bg-white p-8 rounded-2xl border border-gray-200 shadow-sm">
          <p className="mb-6 font-medium text-gray-900">{error}</p>
          <Button onClick={() => refetch()} variant="outline">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 text-gray-900 pb-24">
      {/* Clean Hero Section */}
      <section className="pt-24 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-b border-gray-100 bg-white rounded-b-3xl shadow-sm mb-12">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-3 py-1 mb-6">
            <span className="text-xs font-semibold text-gray-600 tracking-wider uppercase">
              TravelEase Directory
            </span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 tracking-tight leading-[1.1] mb-6">
            Discover Local Favorites <br /> & Hidden Gems
          </h1>

          <p className="text-lg text-gray-600 leading-relaxed mb-8 max-w-2xl">
            Explore restaurants, hotels, attractions, and local services in
            Tagaytay. From cozy cafes to adventure spots, find your next
            favorite place.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 mb-12">
            <a href="#businesses">
              <Button size="lg" className="w-full sm:w-auto min-w-[180px]">
                Browse Businesses
              </Button>
            </a>
            <Link to="/businesses/new">
              <Button variant="outline" size="lg" className="w-full sm:w-auto min-w-[180px]">
                List Your Business
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-8 border-t border-gray-100">
            <div className="flex flex-col">
              <span className="text-3xl font-bold text-gray-900">{total}+</span>
              <span className="text-sm font-medium text-gray-500 uppercase tracking-wider mt-1">Spots Listed</span>
            </div>
            <div className="flex flex-col">
              <span className="text-3xl font-bold text-gray-900">{categories.length}</span>
              <span className="text-sm font-medium text-gray-500 uppercase tracking-wider mt-1">Categories</span>
            </div>
            <div className="flex flex-col">
              <span className="text-3xl font-bold text-gray-900">4.8</span>
              <span className="text-sm font-medium text-gray-500 uppercase tracking-wider mt-1">Avg Rating</span>
            </div>
          </div>
        </div>
      </section>

      <section id="businesses" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:gap-12">
          {/* Filters Sidebar */}
          <div className="w-full lg:sticky lg:top-24 lg:w-72 shrink-0">
            <BusinessFilterBar
              categories={categories}
              onFilterChange={handleFilterChange}
            />
          </div>

          {/* Business Grid */}
          <div className="flex-1 min-w-0">
            {loading && businesses.length === 0 ? (
              <div className="flex justify-center items-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-primary-red" />
              </div>
            ) : businesses.length > 0 ? (
              <>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
                  {businesses.map((business) => (
                    <BusinessCard key={business.id} business={business} />
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="mt-12 flex items-center justify-center gap-2">
                    <button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 cursor-pointer"
                    >
                      Previous
                    </button>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                        (p) => (
                          <button
                            key={p}
                            onClick={() => setPage(p)}
                            className={`w-10 h-10 flex items-center justify-center rounded-lg text-sm font-medium transition-colors duration-200 cursor-pointer ${
                              page === p
                                ? "bg-primary-red text-white"
                                : "text-gray-700 hover:bg-gray-100"
                            }`}
                          >
                            {p}
                          </button>
                        )
                      )}
                    </div>
                    <button
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 cursor-pointer"
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-20 bg-white rounded-2xl border border-gray-100 shadow-sm">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  No businesses found
                </h3>
                <p className="text-gray-500 max-w-md mx-auto">
                  Try adjusting your filters or searching for something else.
                </p>
                <Button
                  variant="outline"
                  className="mt-6"
                  onClick={() => setFilters({ category: null, priceRange: null, search: "" })}
                >
                  Clear Filters
                </Button>
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
