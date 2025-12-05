import { useState } from "react";
import ModalReview from "./ModalReview";
import type { TravelSpotBusiness, BusinessReview } from "../../types/business";
import { useBusinessReviews } from "../../features/reviews/queries";

interface BusinessBoxProps {
  business: TravelSpotBusiness;
}

export default function BusinessBox({
  business,
}: BusinessBoxProps): React.ReactElement {
  const [showReviews, setShowReviews] = useState<boolean>(false);

  const reviewCount = business.reviewCount || 0;

  // Fetch reviews using TanStack Query hook (only when modal is open)
  const { data: rawReviews, isLoading: loadingReviews } = useBusinessReviews(
    showReviews ? business.business_id : undefined
  );

  // Map backend response to frontend shape
  const reviews: BusinessReview[] = (rawReviews || []).map((r: any) => ({
    id: r.review_id,
    rating: r.rating ? Number(r.rating) : null,
    content: r.review_content || r.content,
    date: r.review_date,
    user: r.user
      ? {
          id: r.user.user_id,
          name:
            [r.user.first_name, r.user.last_name].filter(Boolean).join(" ") ||
            "Anonymous",
        }
      : null,
  }));

  // Create business shape for modal (transform TravelSpotBusiness to modal shape)
  const businessWithReviews = {
    id: business.business_id,
    name: business.name,
    description: business.description,
    rating: business.rating,
    picture: business.picture,
    city: business.city,
    reviews,
  };

  return (
    <>
      <div className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-lg hover:border-gray-300 transition-all duration-200 cursor-pointer">
        {/* Header with Name and Rating */}
        <div className="flex justify-between items-start mb-3">
          <h3 className="font-semibold text-lg text-gray-900 leading-tight">
            {business.name}
          </h3>
          {business.rating && (
            <div className="flex items-center gap-1 bg-yellow-50 px-2 py-1 rounded-lg">
              <svg
                className="w-4 h-4 text-yellow-400"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <span className="font-semibold text-gray-900">
                {business.rating ? Number(business.rating).toFixed(1) : "0.0"}
              </span>
            </div>
          )}
        </div>

        {/* Description */}
        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
          {business.description || "No description available"}
        </p>

        {/* Location */}
        <div className="flex items-start gap-2 mb-3">
          <svg
            className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
          <p className="text-sm text-gray-500">
            {business.city || "Location not available"}
          </p>
        </div>

        {/* Reviews Button - Google Maps Style */}
        <button
          onClick={() => setShowReviews(true)}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 transition-colors"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
          Reviews ({reviewCount})
        </button>
      </div>

      {showReviews && (
        <ModalReview
          business={businessWithReviews}
          onClose={() => setShowReviews(false)}
          isLoading={loadingReviews}
        />
      )}
    </>
  );
}
