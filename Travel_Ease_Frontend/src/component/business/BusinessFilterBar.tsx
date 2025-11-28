import React, { useState, useEffect, useRef } from "react";

interface FilterState {
  category: string | null;
  priceRange: string | null;
  search: string;
}

interface BusinessFilterBarProps {
  categories: string[];
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
  loading?: boolean;
}

const PRICE_RANGES = [
  { id: "budget", label: "Budget", min: 0, max: 200 },
  { id: "mid", label: "Mid-range", min: 200, max: 500 },
  { id: "premium", label: "Premium", min: 500, max: 10000 },
];

const BusinessFilterBar: React.FC<BusinessFilterBarProps> = ({
  categories,
  filters,
  onFilterChange,
  loading = false,
}) => {
  const [searchInput, setSearchInput] = useState(filters.search);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const categoryRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (categoryRef.current && !categoryRef.current.contains(e.target as Node)) {
        setShowCategoryDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      if (searchInput !== filters.search) {
        onFilterChange({ ...filters, search: searchInput });
      }
    }, 350);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [searchInput]);

  const handleCategorySelect = (cat: string | null) => {
    onFilterChange({ ...filters, category: cat });
    setShowCategoryDropdown(false);
  };

  const handlePriceSelect = (rangeId: string | null) => {
    onFilterChange({ ...filters, priceRange: rangeId });
  };

  const clearFilters = () => {
    setSearchInput("");
    onFilterChange({ category: null, priceRange: null, search: "" });
  };

  const hasActiveFilters = filters.category || filters.priceRange || filters.search;

  const formatCategoryName = (name: string) => {
    return name.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search businesses..."
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-red focus:border-transparent transition-colors"
            disabled={loading}
          />
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400"
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
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Category Dropdown */}
          <div ref={categoryRef} className="relative">
            <button
              type="button"
              onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border transition-colors ${
                filters.category
                  ? "bg-primary-red text-white border-primary-red"
                  : "bg-white text-gray-700 border-gray-300 hover:border-primary-red"
              }`}
              disabled={loading}
            >
              <span>
                {filters.category
                  ? formatCategoryName(filters.category)
                  : "Category"}
              </span>
              <svg
                className={`h-4 w-4 transition-transform ${
                  showCategoryDropdown ? "rotate-180" : ""
                }`}
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
            </button>

            {showCategoryDropdown && (
              <div className="absolute top-full left-0 mt-2 w-56 bg-white rounded-lg border border-gray-200 shadow-lg z-50 py-2 max-h-64 overflow-y-auto">
                <button
                  type="button"
                  onClick={() => handleCategorySelect(null)}
                  className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors ${
                    !filters.category ? "text-primary-red font-medium" : "text-gray-700"
                  }`}
                >
                  All Categories
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => handleCategorySelect(cat)}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors ${
                      filters.category === cat
                        ? "text-primary-red font-medium"
                        : "text-gray-700"
                    }`}
                  >
                    {formatCategoryName(cat)}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Price Range Chips */}
          <div className="flex items-center gap-2">
            {PRICE_RANGES.map((range) => (
              <button
                key={range.id}
                type="button"
                onClick={() =>
                  handlePriceSelect(filters.priceRange === range.id ? null : range.id)
                }
                className={`px-3 py-2 rounded-full text-sm font-medium transition-colors ${
                  filters.priceRange === range.id
                    ? "bg-primary-red text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
                disabled={loading}
              >
                {range.label}
              </button>
            ))}
          </div>

          {/* Clear Filters */}
          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="flex items-center gap-1 px-3 py-2 text-sm text-gray-500 hover:text-primary-red transition-colors"
              disabled={loading}
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
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Active Filter Chips */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t border-gray-100">
          <span className="text-sm text-gray-500">Active filters:</span>
          {filters.category && (
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-primary-red/10 text-primary-red rounded-full text-sm">
              {formatCategoryName(filters.category)}
              <button
                type="button"
                onClick={() => onFilterChange({ ...filters, category: null })}
                className="hover:bg-primary-red/20 rounded-full p-0.5"
              >
                <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </span>
          )}
          {filters.priceRange && (
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-primary-red/10 text-primary-red rounded-full text-sm">
              {PRICE_RANGES.find((r) => r.id === filters.priceRange)?.label}
              <button
                type="button"
                onClick={() => onFilterChange({ ...filters, priceRange: null })}
                className="hover:bg-primary-red/20 rounded-full p-0.5"
              >
                <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </span>
          )}
          {filters.search && (
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-primary-red/10 text-primary-red rounded-full text-sm">
              "{filters.search}"
              <button
                type="button"
                onClick={() => {
                  setSearchInput("");
                  onFilterChange({ ...filters, search: "" });
                }}
                className="hover:bg-primary-red/20 rounded-full p-0.5"
              >
                <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default BusinessFilterBar;
