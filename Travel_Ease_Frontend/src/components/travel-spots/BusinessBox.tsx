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

  // Default placeholder image for businesses without images
  const placeholderImage = "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=200&fit=crop&auto=format";

  // Parse the picture field - it might be a JSON string with multiple URLs
  const getImageUrl = (): string => {
    if (!business.picture) return placeholderImage;
    
    try {
      // Handle JSON format: {"secure_url":["url1","url2"]}
      const parsed = JSON.parse(business.picture);
      if (parsed.secure_url && Array.isArray(parsed.secure_url) && parsed.secure_url.length > 0) {
        return parsed.secure_url[0];
      }
      if (typeof parsed === "string") return parsed;
    } catch {
      // Not JSON, use as-is
      if (typeof business.picture === "string" && business.picture.startsWith("http")) {
        return business.picture;
      }
    }
    return placeholderImage;
  };

  const imageUrl = getImageUrl();

  return (
    <>
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg hover:border-gray-300 transition-colors duration-200 cursor-pointer">
        {/* Featured Image */}
        <div className="relative h-40 bg-gray-100">
          <img
            src={imageUrl}
            alt={business.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = placeholderImage;
            }}
          />
          {/* Rating Badge */}
          {business.rating && (
            <div className="absolute top-3 right-3 flex items-center gap-1 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-lg shadow-sm">
              <svg
                className="w-4 h-4 text-yellow-400"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <span className="font-semibold text-gray-900 text-sm">
                {business.rating ? Number(business.rating).toFixed(1) : "0.0"}
              </span>
            </div>
          )}
        </div>

        {/* Card Content */}
        <div className="p-5">
          {/* Header with Name */}
          <h3 className="font-semibold text-lg text-gray-900 leading-tight mb-2">
            {business.name}
          </h3>

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
