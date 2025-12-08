import React, { useState } from "react";
import { useTravelSpots } from "../../features/businesses/queries";
import type { SearchResult } from "../../types/map";
import type { TravelPlanDates } from "../../types/travelPlan";
import BusinessDetailModal from "./BusinessDetailModal";

// Main categories from the database enum
const CATEGORIES = [
  { id: "food_drinks", label: "Food & Drinks", icon: "🍽️" },
  { id: "tours_activities", label: "Tours & Activities", icon: "🎯" },
  { id: "transport_transfers", label: "Transport & Transfers", icon: "🚗" },
  { id: "travel_services", label: "Travel Services", icon: "✈️" },
  { id: "shopping_souvenirs", label: "Shopping & Souvenirs", icon: "🛍️" },
  { id: "wellness_medical", label: "Wellness & Medical", icon: "💆" },
  { id: "events_experiences", label: "Events & Experiences", icon: "🎪" },
  { id: "outdoor_gear_rental", label: "Outdoor / Gear Rental", icon: "🎒" },
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

  // Fetch businesses with category filter
  const { data: travelSpotsData, isLoading, isError, refetch } = useTravelSpots({
    category: selectedCategory || undefined,
  });

  const businesses = travelSpotsData?.data || [];

  const handleCategoryClick = (categoryId: string | null) => {
    setSelectedCategory(categoryId);
  };

  const handleBusinessClick = (business: Business) => {
    setSelectedBusiness(business);
    // Also show on map
    if (business.latitude && business.longitude) {
      onBusinessSelect({
        lat: business.latitude,
        lng: business.longitude,
      });
    }
  };

  const handleAddToPlan = (business: Business) => {
    // Use business's latitude and longitude as coordinates
    if (!business.latitude || !business.longitude) {
      alert("This business does not have location coordinates available.");
      return;
    }

    // Convert to SearchResult format for CreateActivity
    // Include business_id and use business's latitude/longitude as coordinates
    const searchResult: SearchResult = {
      name: business.name,
      label: business.name,
      address: {
        city: business.city || undefined,
        country: undefined,
      },
      lat: Number(business.latitude),
      lng: Number(business.longitude),
      business_id: business.business_id, // Pass business_id to link the activity
    };
    onAddToActivity(searchResult);
    setSelectedBusiness(null);
  };

  return (
    <div className="h-full flex flex-col">
      {/* Category Filter */}
      <div className="p-4 border-b border-gray-100">
        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
          Categories
        </h4>
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          <button
            onClick={() => handleCategoryClick(null)}
            className={`px-3 py-1.5 text-sm font-medium rounded-full whitespace-nowrap transition-colors ${
              selectedCategory === null
                ? "bg-red-600 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            All
          </button>
          {CATEGORIES.map((category) => (
            <button
              key={category.id}
              onClick={() => handleCategoryClick(category.id)}
              className={`px-3 py-1.5 text-sm font-medium rounded-full whitespace-nowrap transition-colors flex items-center gap-1 ${
                selectedCategory === category.id
                  ? "bg-red-600 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              <span>{category.icon}</span>
              <span>{category.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Price Filter (Coming Soon) */}
      <div className="px-4 py-2 border-b border-gray-100">
        <button
          onClick={() => setShowPriceFilter(!showPriceFilter)}
          className="flex items-center justify-between w-full text-sm text-gray-600 hover:text-gray-900"
        >
          <span className="flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Price Filter
            <span className="text-xs px-1.5 py-0.5 bg-yellow-100 text-yellow-700 rounded">Coming Soon</span>
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
          <div className="mt-2 flex gap-2 flex-wrap opacity-50 pointer-events-none">
            {PRICE_RANGES.map((range) => (
              <button
                key={range.id}
                disabled
                className="px-2.5 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-400 cursor-not-allowed"
              >
                {range.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Business List */}
      <div className="flex-1 overflow-y-auto p-4">
        {isLoading && (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
          </div>
        )}

        {isError && (
          <div className="text-center py-8">
            <p className="text-red-500 mb-2">Failed to load businesses</p>
            <button onClick={() => refetch()} className="soft_btn text-sm">
              Retry
            </button>
          </div>
        )}

        {!isLoading && !isError && businesses.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            <p>No businesses found</p>
            {selectedCategory && (
              <button
                onClick={() => setSelectedCategory(null)}
                className="text-red-600 text-sm mt-2 hover:underline"
              >
                Clear filter
              </button>
            )}
          </div>
        )}

        {!isLoading && !isError && businesses.length > 0 && (
          <div className="space-y-3">
            {businesses.map((business: Business) => (
              <div
                key={business.business_id}
                onClick={() => handleBusinessClick(business)}
                className="bg-gray-50 rounded-lg p-3 cursor-pointer hover:bg-gray-100 transition-colors border border-gray-100"
              >
                <div className="flex gap-3">
                  {/* Business Image */}
                  <div className="w-16 h-16 flex-shrink-0 rounded-lg bg-gray-200 overflow-hidden">
                    {business.picture ? (
                      <img
                        src={business.picture}
                        alt={business.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                      </div>
                    )}
                  </div>

                  {/* Business Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 text-sm truncate">
                      {business.name}
                    </h3>
                    {business.city && (
                      <p className="text-xs text-gray-500 truncate">
                        {business.brgy ? `${business.brgy}, ` : ""}{business.city}
                      </p>
                    )}
                    {business.rating && (
                      <div className="flex items-center gap-1 mt-1">
                        <svg className="w-3.5 h-3.5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        <span className="text-xs text-gray-600">{Number(business.rating).toFixed(1)}</span>
                      </div>
                    )}
                    {/* Category badges */}
                    {business.categories && business.categories.length > 0 && (
                      <div className="flex gap-1 mt-1 flex-wrap">
                        {business.categories.slice(0, 2).map((cat, idx) => (
                          <span
                            key={idx}
                            className="text-xs px-1.5 py-0.5 bg-gray-200 text-gray-600 rounded"
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

