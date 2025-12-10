import React, { useState, useRef, useCallback } from "react";
import { useTravelSpots } from "../../features/businesses/queries";
import type { SearchResult } from "../../types/map";
import type { TravelPlanDates } from "../../types/travelPlan";
import BusinessDetailModal from "./BusinessDetailModal";

// Main categories from the database enum
const CATEGORIES = [
  { id: "food_drinks", label: "Food & Drinks", icon: "🍽️" },
  { id: "tours_activities", label: "Tours", icon: "🎯" },
  { id: "transport_transfers", label: "Transport", icon: "🚗" },
  { id: "travel_services", label: "Services", icon: "✈️" },
  { id: "shopping_souvenirs", label: "Shopping", icon: "🛍️" },
  { id: "wellness_medical", label: "Wellness", icon: "💆" },
  { id: "events_experiences", label: "Events", icon: "🎪" },
  { id: "outdoor_gear_rental", label: "Outdoor", icon: "🎒" },
];

// Price ranges (UI only for now)
const PRICE_RANGES = [
  { id: "0-100", label: "₱0-100" },
  { id: "100-200", label: "₱100-200" },
  { id: "200-400", label: "₱200-400" },
  { id: "400-700", label: "₱400-700" },
  { id: "700-1000", label: "₱700-1000" },
  { id: "1000-1500", label: "₱1000-1500" },
  { id: "1500+", label: "₱1500+" },
];

interface SuggestedBusinessesProps {
  planId: string;
  dates: TravelPlanDates;
  canEdit: boolean;
  onBusinessSelect: (business: { lat?: number; lng?: number; longitude?: number }) => void;
  onAddToActivity: (business: SearchResult) => void;
}

interface Business {
  business_id: number;
  name: string;
  description?: string | null;
  city?: string | null;
  brgy?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  rating?: number | null;
  picture?: string | null;
  categories?: { category_name: string }[];
}

export default function SuggestedBusinesses({
  planId,
  dates,
  canEdit,
  onBusinessSelect,
  onAddToActivity,
}: SuggestedBusinessesProps): React.ReactElement {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedPriceRange, setSelectedPriceRange] = useState<string | null>(null);
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null);
  const [showPriceFilter, setShowPriceFilter] = useState(false);
  const [scrollFade, setScrollFade] = useState({ left: false, right: true });
  const scrollRef = useRef<HTMLDivElement>(null);

  // Handle scroll position to show/hide gradient fades
  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setScrollFade({
      left: scrollLeft > 8,
      right: scrollLeft < scrollWidth - clientWidth - 8,
    });
  }, []);

  const { data: travelSpotsData, isLoading, isError, refetch } = useTravelSpots({
    category: selectedCategory || undefined,
  });

  const businesses = travelSpotsData?.data || [];

  const handleCategoryClick = (categoryId: string | null) => {
    setSelectedCategory(categoryId);
  };

  const handleBusinessClick = (business: Business) => {
    setSelectedBusiness(business);
    
    if (business.latitude && business.longitude) {
      onBusinessSelect({
        lat: business.latitude,
        lng: business.longitude,
      });
    }
  };

  const handleAddToPlan = (business: Business) => {
    const lat = business.latitude != null && !isNaN(Number(business.latitude)) ? Number(business.latitude) : 0;
    const lng = business.longitude != null && !isNaN(Number(business.longitude)) ? Number(business.longitude) : 0;
    
    const searchResult: SearchResult = {
      name: business.name,
      label: business.name,
      address: {
        city: business.city || undefined,
        country: undefined,
      },
      lat,
      lng,
      business_id: business.business_id,
    };
    
    onAddToActivity(searchResult);
    setSelectedBusiness(null);
  };

  return (
    <div className="h-full flex flex-col">
      {/* Category Filter */}
      <div className="p-4 border-b border-gray-100 bg-gray-50/50">
        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
          Browse by Category
        </h4>
        <div className="relative">
          {/* Left fade gradient */}
          <div 
            className={`absolute left-0 top-0 bottom-0 w-6 bg-gradient-to-r from-gray-50 to-transparent z-10 pointer-events-none transition-opacity duration-200 ${
              scrollFade.left ? 'opacity-100' : 'opacity-0'
            }`} 
          />
          {/* Right fade gradient */}
          <div 
            className={`absolute right-0 top-0 bottom-0 w-6 bg-gradient-to-l from-gray-50 to-transparent z-10 pointer-events-none transition-opacity duration-200 ${
              scrollFade.right ? 'opacity-100' : 'opacity-0'
            }`} 
          />
          <div 
            ref={scrollRef}
            onScroll={handleScroll}
            className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide scroll-smooth"
          >
            <button
              onClick={() => handleCategoryClick(null)}
              className={`px-3 py-2 text-xs font-medium rounded-lg whitespace-nowrap transition-all duration-200 chip-interactive ${
                selectedCategory === null
                  ? "bg-primary-red text-white shadow-sm"
                  : "bg-white text-gray-600 border border-gray-200 hover:border-gray-300 hover:bg-gray-50"
              }`}
            >
              All
            </button>
            {CATEGORIES.map((category) => (
              <button
                key={category.id}
                onClick={() => handleCategoryClick(category.id)}
                className={`px-3 py-2 text-xs font-medium rounded-lg whitespace-nowrap transition-all duration-200 chip-interactive flex items-center gap-1.5 ${
                  selectedCategory === category.id
                    ? "bg-primary-red text-white shadow-sm"
                    : "bg-white text-gray-600 border border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                }`}
              >
                <span>{category.icon}</span>
                <span>{category.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Price Filter (Coming Soon) */}
      <div className="px-4 py-3 border-b border-gray-100">
        <button
          onClick={() => setShowPriceFilter(!showPriceFilter)}
          className="flex items-center justify-between w-full text-sm text-gray-600 hover:text-gray-900 transition-colors"
        >
          <span className="flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="font-medium">Price Range</span>
            <span className="text-[10px] px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded font-medium">Soon</span>
          </span>
          <svg 
            className={`w-4 h-4 transition-transform ${showPriceFilter ? 'rotate-180' : ''}`} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {showPriceFilter && (
          <div className="mt-3 flex gap-2 flex-wrap opacity-50 pointer-events-none">
            {PRICE_RANGES.map((range) => (
              <button
                key={range.id}
                disabled
                className="px-2.5 py-1.5 text-xs font-medium rounded-lg bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200"
              >
                {range.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Business List */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* Loading state */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-red mb-3"></div>
            <p className="text-sm text-gray-500">Loading businesses...</p>
          </div>
        )}

        {/* Error state */}
        {isError && (
          <div className="text-center py-12">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <p className="text-gray-600 font-medium mb-2">Failed to load</p>
            <button onClick={() => refetch()} className="text-sm text-primary-red hover:underline">
              Try again
            </button>
          </div>
        )}

        {/* Empty state */}
        {!isLoading && !isError && businesses.length === 0 && (
          <div className="text-center py-12">
            <div className="w-14 h-14 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-3">
              <svg className="w-7 h-7 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <p className="text-gray-600 font-medium">No businesses found</p>
            {selectedCategory && (
              <button
                onClick={() => setSelectedCategory(null)}
                className="text-sm text-primary-red mt-2 hover:underline"
              >
                Clear filter
              </button>
            )}
          </div>
        )}

        {/* Business cards */}
        {!isLoading && !isError && businesses.length > 0 && (
          <div className="space-y-3">
            {businesses.map((business: Business) => (
              <div
                key={business.business_id}
                onClick={(e) => {
                  if (e.detail === 2 || e.ctrlKey || e.metaKey) {
                    handleAddToPlan(business);
                  } else {
                    handleBusinessClick(business);
                  }
                }}
                className="group bg-white rounded-xl p-3 cursor-pointer hover:shadow-md transition-all duration-200 border border-gray-100 hover:border-gray-200"
                title="Click to view, double-click to add"
              >
                <div className="flex gap-3">
                  {/* Business Image */}
                  <div className="w-16 h-16 flex-shrink-0 rounded-lg bg-gray-100 overflow-hidden">
                    {business.picture ? (
                      <img
                        src={business.picture}
                        alt={business.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-300">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                      </div>
                    )}
                  </div>

                  {/* Business Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-semibold text-gray-900 text-sm line-clamp-1 group-hover:text-primary-red transition-colors">
                        {business.name}
                      </h3>
                      {canEdit && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAddToPlan(business);
                          }}
                          className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity px-2 py-1 text-xs font-medium bg-primary-red text-white rounded-lg hover:bg-primary-red-dark"
                          title="Add to plan"
                        >
                          + Add
                        </button>
                      )}
                    </div>
                    
                    {business.city && (
                      <p className="text-xs text-gray-500 truncate mt-0.5">
                        {business.brgy ? `${business.brgy}, ` : ""}{business.city}
                      </p>
                    )}
                    
                    {/* Rating */}
                    {business.rating && (
                      <div className="flex items-center gap-1 mt-1.5">
                        <div className="flex items-center gap-0.5">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <svg
                              key={star}
                              className={`w-3 h-3 ${
                                star <= Math.round(Number(business.rating))
                                  ? "text-amber-400"
                                  : "text-gray-200"
                              }`}
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                          ))}
                        </div>
                        <span className="text-xs text-gray-500">
                          {Number(business.rating).toFixed(1)}
                        </span>
                      </div>
                    )}
                    
                    {/* Category badges */}
                    {business.categories && business.categories.length > 0 && (
                      <div className="flex gap-1 mt-2 flex-wrap">
                        {business.categories.slice(0, 2).map((cat, idx) => (
                          <span
                            key={idx}
                            className="text-[10px] px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded"
                          >
                            {cat.category_name}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Business Detail Modal */}
      {selectedBusiness && (
        <BusinessDetailModal
          business={selectedBusiness}
          canEdit={canEdit}
          onClose={() => setSelectedBusiness(null)}
          onAddToPlan={() => handleAddToPlan(selectedBusiness)}
        />
      )}
    </div>
  );
}
