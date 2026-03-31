import { CATEGORIES, SORT_OPTIONS, type SortOption } from "./constants";

function formatPrice(value: number): string {
  return value >= 1000
    ? `₱${(value / 1000).toFixed(value % 1000 === 0 ? 0 : 1)}k`
    : `₱${value}`;
}

interface ResultsHeaderProps {
  totalCount: number;
  category: string | null;
  onClearCategory: () => void;
  priceRange: [number, number];
  isPriceFiltered: boolean;
  onClearPriceRange: () => void;
  sortBy: SortOption;
  onSortChange: (sort: SortOption) => void;
  onMobileFilterClick: () => void;
  onClearAll: () => void;
}

export default function ResultsHeader({
  totalCount,
  category,
  onClearCategory,
  priceRange,
  isPriceFiltered,
  onClearPriceRange,
  sortBy,
  onSortChange,
  onMobileFilterClick,
  onClearAll,
}: ResultsHeaderProps): React.ReactElement {
  const hasActiveFilters = category !== null || isPriceFiltered;

  return (
    <div className="mb-6 flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onMobileFilterClick}
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

          <h2 className="text-xl font-bold text-gray-900">
            {totalCount} {totalCount === 1 ? "Spot" : "Spots"} Available
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <label
            htmlFor="sort-options"
            className="text-sm font-medium text-gray-600"
          >
            Sort by:
          </label>
          <div className="relative">
            <select
              id="sort-options"
              value={sortBy}
              onChange={(e) => onSortChange(e.target.value as SortOption)}
              className="appearance-none rounded-lg border border-gray-200 bg-white py-2 pl-3 pr-8 text-sm font-medium text-gray-900 focus:border-primary-red focus:outline-none focus:ring-1 focus:ring-primary-red cursor-pointer"
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
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
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-gray-500">Active filters:</span>

          {category && (
            <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-800">
              {CATEGORIES.find((c) => c.value === category)?.label}
              <button
                onClick={onClearCategory}
                className="ml-1 rounded-full p-0.5 text-gray-500 hover:bg-gray-200 hover:text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-red"
                aria-label="Remove category filter"
              >
                <svg
                  className="h-3.5 w-3.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </span>
          )}

          {isPriceFiltered && (
            <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-800">
              {formatPrice(priceRange[0])} &ndash; {formatPrice(priceRange[1])}
              <button
                onClick={onClearPriceRange}
                className="ml-1 rounded-full p-0.5 text-gray-500 hover:bg-gray-200 hover:text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-red"
                aria-label="Remove price filter"
              >
                <svg
                  className="h-3.5 w-3.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </span>
          )}

          <button
            onClick={onClearAll}
            className="ml-2 text-sm font-medium text-primary-red hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-red rounded"
          >
            Clear all
          </button>
        </div>
      )}
    </div>
  );
}
