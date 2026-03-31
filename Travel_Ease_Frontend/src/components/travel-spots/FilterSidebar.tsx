import { useEffect } from "react";
import { CATEGORIES, PRICE_SLIDER_MIN, PRICE_SLIDER_MAX, PRICE_SLIDER_STEP } from "./constants";
import PriceRangeSlider from "./PriceRangeSlider";

interface FilterSidebarProps {
  category: string | null;
  onCategoryChange: (category: string | null) => void;
  priceRange: [number, number];
  onPriceRangeChange: (range: [number, number]) => void;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
  isDesktop?: boolean;
}

export default function FilterSidebar({
  category,
  onCategoryChange,
  priceRange,
  onPriceRangeChange,
  isOpenMobile = false,
  onCloseMobile,
  isDesktop = false,
}: FilterSidebarProps): React.ReactElement {

  useEffect(() => {
    if (!isDesktop && isOpenMobile) {
      document.body.style.overflow = "hidden";
      return () => { document.body.style.overflow = ""; };
    }
  }, [isDesktop, isOpenMobile]);

  const content = (
    <div className="flex h-full flex-col gap-6">
      {/* Categories */}
      <div>
        <h3 className="mb-2.5 text-xs font-semibold uppercase tracking-wider text-gray-500">Category</h3>
        <div className="flex flex-col gap-0.5">
          <button
            type="button"
            onClick={() => onCategoryChange(null)}
            className={`text-left text-sm px-3 py-2 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-red rounded-lg ${
              category === null
                ? "bg-red-50 font-semibold text-red-700"
                : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
            }`}
          >
            All Categories
          </button>
          {CATEGORIES.map((c) => (
            <button
              key={c.value}
              type="button"
              onClick={() => onCategoryChange(c.value)}
              className={`text-left text-sm px-3 py-2 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-red rounded-lg ${
                category === c.value
                  ? "bg-red-50 font-semibold text-red-700"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* Divider */}
      <hr className="border-gray-200" />

      {/* Price Range Slider */}
      <div>
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500">Price Range</h3>
        <PriceRangeSlider
          min={PRICE_SLIDER_MIN}
          max={PRICE_SLIDER_MAX}
          step={PRICE_SLIDER_STEP}
          value={priceRange}
          onChange={onPriceRangeChange}
        />
      </div>
    </div>
  );

  if (isDesktop) {
    return (
      <aside className="w-full overflow-y-auto overflow-x-hidden p-1 max-h-[calc(100vh-6rem)]">
        <h2 className="mb-5 text-base font-bold text-gray-900">Filters</h2>
        {content}
      </aside>
    );
  }

  return (
    <>
      {isOpenMobile && (
        <div
          className="fixed inset-0 z-[1005] bg-black/50 transition-opacity"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      <aside
        aria-hidden={!isOpenMobile}
        className={`fixed inset-y-0 left-0 z-[1010] w-[85vw] max-w-[320px] sm:w-80 overflow-y-auto overscroll-contain bg-white p-6 shadow-xl transition-transform duration-300 ease-in-out ${
          isOpenMobile
            ? "translate-x-0 pointer-events-auto"
            : "-translate-x-full pointer-events-none"
        }`}
      >
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">Filters</h2>
          <button
            onClick={onCloseMobile}
            tabIndex={isOpenMobile ? 0 : -1}
            className="rounded-full p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-red"
            aria-label="Close filters"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {content}
      </aside>
    </>
  );
}
