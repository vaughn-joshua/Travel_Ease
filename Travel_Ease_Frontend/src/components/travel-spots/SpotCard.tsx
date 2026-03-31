import { useState } from "react";
import { useNavigate } from "react-router-dom";
import ModalReview from "./ModalReview";
import type { TravelSpotBusiness, BusinessReview } from "../../types/business";
import { useBusinessReviews } from "../../features/reviews/queries";

interface SpotCardProps {
  business: TravelSpotBusiness;
}

export default function SpotCard({
  business,
}: SpotCardProps): React.ReactElement {
  const navigate = useNavigate();
  const [showReviews, setShowReviews] = useState<boolean>(false);

  const reviewCount = business.reviewCount || 0;

  // Fetch reviews using TanStack Query hook (only when modal is open)
  const { data: rawReviews, isLoading: loadingReviews } = useBusinessReviews(
    showReviews ? business.business_id : undefined,
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
  const placeholderImage =
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=600&fit=crop&auto=format";

  // Parse the picture field
  const getImageUrl = (): string => {
    if (!business.picture) return placeholderImage;

    try {
      const parsed = JSON.parse(business.picture);
      if (
        parsed.secure_url &&
        Array.isArray(parsed.secure_url) &&
        parsed.secure_url.length > 0
      ) {
        return parsed.secure_url[0];
      }
      if (typeof parsed === "string") return parsed;
    } catch {
      if (
        typeof business.picture === "string" &&
        business.picture.startsWith("http")
      ) {
        return business.picture;
      }
    }
    return placeholderImage;
  };

  const imageUrl = getImageUrl();
  const formattedRating = business.rating
    ? Number(business.rating).toFixed(1)
    : null;

  const openBusinessDetails = (): void => {
    navigate(`/businesses/${business.business_id}?readonly=1`);
  };

  return (
    <>
      <div
        role="button"
        tabIndex={0}
        onClick={openBusinessDetails}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            openBusinessDetails();
          }
        }}
        className="group flex min-w-0 cursor-pointer flex-col gap-3 rounded-2xl border border-gray-100 bg-white p-3 shadow-sm transition-shadow hover:shadow-md"
      >
        {/* Image Container - Aspect 4/3 makes image the hero */}
        <div className="relative aspect-[4/3] w-full overflow-hidden rounded-[var(--radius-lg,16px)] bg-gray-100 shrink-0">
          <img
            src={imageUrl}
            alt={business.name || "Travel spot image"}
            width={400}
            height={300}
            loading="lazy"
            className="h-full w-full object-cover transition-opacity duration-300 ease-out group-hover:opacity-90"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = placeholderImage;
            }}
          />
          {/* Rating Badge */}
          {formattedRating && (
            <div className="absolute right-3 top-3 flex items-center gap-1 rounded-[var(--radius-md,12px)] bg-white/90 px-2 py-1 shadow-sm backdrop-blur-md">
              <svg
                className="h-3.5 w-3.5 text-yellow-500"
                fill="currentColor"
                viewBox="0 0 20 20"
                aria-hidden="true"
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <span className="text-xs font-semibold text-gray-900">
                {formattedRating}
              </span>
            </div>
          )}
        </div>

        {/* Content Container - Minimal and scannable */}
        <div className="flex flex-col gap-1 min-w-0">
          <div className="flex items-start justify-between gap-2 min-w-0">
            <h3
              className="text-base font-semibold leading-tight text-gray-900 truncate"
              title={business.name}
            >
              {business.name}
            </h3>
          </div>

          <div className="flex items-center text-sm text-gray-500 min-w-0">
            <span className="truncate">
              {business.city || "Location not available"}
            </span>
          </div>

          {/* Quick Price/Meta row */}
          <div className="mt-1 flex flex-wrap items-center justify-between gap-x-2 gap-y-1">
            <span className="text-sm font-medium text-gray-700 truncate max-w-[60%]">
              {business.min_price !== null && business.max_price !== null
                ? `₱${business.min_price} - ₱${business.max_price}`
                : business.min_price !== null
                  ? `From ₱${business.min_price}`
                  : ""}
            </span>
            <button
              onClick={(event) => {
                event.stopPropagation();
                setShowReviews(true);
              }}
              className="text-sm font-medium text-primary-red underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-red rounded shrink-0"
              aria-label={`View ${reviewCount} reviews for ${business.name}`}
            >
              {reviewCount} {reviewCount === 1 ? "review" : "reviews"}
            </button>
          </div>
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
