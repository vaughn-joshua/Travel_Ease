import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import BusinessCard, { Business } from "../components/business/BusinessCard";
import BusinessFilterBar from "../components/business/BusinessFilterBar";
import {
  useBusinessList,
  useBusinessCategories,
} from "../features/businesses/queries";

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
        <div className="max-w-md text-center">
          <p className="mb-4 font-medium text-red-600">{error}</p>
          <button onClick={() => refetch()} className="btn-primary">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-white text-gray-900">
      {/* Hero Section - matching blog style */}
      <section className="relative overflow-hidden text-white">
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1200&q=75"
            alt="Local businesses and cafes"
            className="h-full w-full object-cover"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-slate-900/70 via-slate-900/30 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-white to-transparent" />
        </div>
        <div
          className="pointer-events-none absolute -top-32 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-white/25 blur-3xl"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute -bottom-48 right-12 h-72 w-72 rounded-full bg-white/20 blur-3xl"
          aria-hidden="true"
        />

        <div className="relative mx-auto flex max-w-6xl flex-col items-center gap-12 px-4 py-24 text-center sm:px-6 lg:px-8 lg:py-32">
          <div className="w-full max-w-3xl rounded-[30px] border border-white/25 bg-white/10 p-10 shadow-lg shadow-primary-red/20 backdrop-blur">
            <div className="mb-6 flex items-center justify-center gap-3">
              <span className="inline-flex items-center rounded-full border border-white/40 px-5 py-2 text-xs font-semibold uppercase tracking-[0.3em]">
                TravelEase Directory
              </span>
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
              Discover Local Businesses
            </h1>
            <p className="mt-6 text-base leading-relaxed text-white/90 sm:text-xl">
              Explore restaurants, hotels, attractions, and local services in
              Tagaytay. From cozy cafes to adventure spots, find your next
              favorite place.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row sm:gap-6">
              <a
                href="#businesses"
                className="w-full max-w-xs rounded-full border border-white bg-white px-7 py-3 text-sm font-semibold uppercase tracking-[0.18em] text-primary-red transition hover:bg-white/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-primary-red sm:w-auto"
              >
                Browse Businesses
              </a>
              <Link
                to="/businesses/new"
                className="w-full max-w-xs rounded-full border border-white/60 px-7 py-3 text-sm font-semibold uppercase tracking-[0.18em] text-white transition hover:border-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-primary-red sm:w-auto"
              >
                List Your Business
              </Link>
            </div>
          </div>

          <dl className="grid w-full max-w-4xl grid-cols-1 gap-4 rounded-2xl border border-white/25 bg-white/15 p-8 text-left shadow-lg shadow-primary-red/10 backdrop-blur sm:grid-cols-3">
            <div className="flex flex-col gap-2 rounded-xl border border-white/20 bg-white/10 px-5 py-4">
              <dt className="text-xs font-semibold uppercase tracking-[0.25em] text-white/70">
                Businesses Listed
              </dt>
              <dd className="text-2xl font-semibold text-white">
                {total}+ Spots
              </dd>
            </div>
            <div className="flex flex-col gap-2 rounded-xl border border-white/20 bg-white/10 px-5 py-4">
              <dt className="text-xs font-semibold uppercase tracking-[0.25em] text-white/70">
                Categories
              </dt>
              <dd className="text-2xl font-semibold text-white">
                {categories.length} Types
              </dd>
            </div>
            <div className="flex flex-col gap-2 rounded-xl border border-white/20 bg-white/10 px-5 py-4">
              <dt className="text-xs font-semibold uppercase tracking-[0.25em] text-white/70">
                Location
              </dt>
              <dd className="text-2xl font-semibold text-white">
                Tagaytay, PH
              </dd>
            </div>
          </dl>
        </div>
      </section>

      {/* Main Content */}
      <section id="businesses" className="py-12 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Filter Bar */}
          <div className="mb-8">
            <BusinessFilterBar
              categories={categories}
              filters={filters}
              onFilterChange={handleFilterChange}
              loading={loading}
            />
          </div>

          {/* Results Info */}
          <div className="flex items-center justify-between mb-6">
            <p className="text-gray-600">
              {loading ? (
                "Loading..."
              ) : (
                <>
                  Showing{" "}
                  <span className="font-semibold">{businesses.length}</span> of{" "}
                  <span className="font-semibold">{total}</span> businesses
                </>
              )}
            </p>
            <Link
              to="/businesses/new"
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-primary-red border border-primary-red rounded-lg hover:bg-primary-red hover:text-white transition-colors"
            >
              <svg
                className="w-4 h-4 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
              </svg>
              Add Business
            </Link>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center py-16">
              <div className="text-center">
                <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-primary-red" />
                <p className="text-base text-gray-600">Loading businesses...</p>
              </div>
            </div>
          )}

          {/* Empty State */}
          {!loading && businesses.length === 0 && (
            <div className="text-center py-16">
              <svg
                className="mx-auto h-16 w-16 text-gray-300 mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                />
              </svg>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No businesses found
              </h3>
              <p className="text-gray-600 mb-6">
                Try adjusting your filters or search terms.
              </p>
              <button
                onClick={() =>
                  setFilters({ category: null, priceRange: null, search: "" })
                }
                className="btn-secondary"
              >
                Clear Filters
              </button>
            </div>
          )}

          {/* Business Grid */}
          {!loading && businesses.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {businesses.map((business) => (
                <BusinessCard key={business.id} business={business} />
              ))}
            </div>
          )}

          {/* Pagination */}
          {!loading && totalPages > 1 && (
            <div className="mt-12 flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum: number;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (page <= 3) {
                    pageNum = i + 1;
                  } else if (page >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = page - 2 + i;
                  }
                  return (
                    <button
                      key={pageNum}
                      type="button"
                      onClick={() => setPage(pageNum)}
                      className={`w-10 h-10 text-sm font-medium rounded-lg transition-colors ${
                        page === pageNum
                          ? "bg-primary-red text-white"
                          : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </section>

      {/* CTA Section - matching blog style */}
      <section className="bg-primary-red text-white">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-6 px-4 py-16 text-center sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold sm:text-4xl">
            Own a Business in Tagaytay?
          </h2>
          <p className="max-w-2xl text-base text-white/90 sm:text-lg">
            Get discovered by thousands of travelers. List your business on
            TravelEase and reach visitors planning their next adventure.
          </p>
          <Link
            to="/businesses/new"
            className="rounded-lg border border-white bg-white px-6 py-3 text-sm font-semibold uppercase tracking-wide text-primary-red transition hover:bg-white/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-primary-red"
          >
            List Your Business Free
          </Link>
        </div>
      </section>
    </main>
  );
}
