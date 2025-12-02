import { useMemo, useState } from "react";
import type { Business, BusinessReview } from "../../types/business";

interface ModalReviewProps {
  business: Business;
  onClose: () => void;
  isLoading?: boolean;
}

/**
 * Format date to relative time (e.g., "2 weeks ago", "3 months ago")
 */
function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  const intervals = [
    { label: "year", seconds: 31536000 },
    { label: "month", seconds: 2592000 },
    { label: "week", seconds: 604800 },
    { label: "day", seconds: 86400 },
    { label: "hour", seconds: 3600 },
    { label: "minute", seconds: 60 },
  ];

  for (const interval of intervals) {
    const count = Math.floor(diffInSeconds / interval.seconds);
    if (count >= 1) {
      return `${count} ${interval.label}${count > 1 ? "s" : ""} ago`;
    }
  }

  return "Just now";
}

/**
 * Generate initials from a name
 */
function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

/**
 * Generate a consistent color based on name
 */
function getAvatarColor(name: string): string {
  const colors = [
    "bg-blue-500",
    "bg-green-500",
    "bg-purple-500",
    "bg-pink-500",
    "bg-indigo-500",
    "bg-teal-500",
    "bg-orange-500",
    "bg-cyan-500",
  ];
  const index = name.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return colors[index % colors.length];
}

/**
 * Star Rating Component
 */
function StarRating({ rating, size = "sm" }: { rating: number; size?: "sm" | "md" | "lg" }) {
  const sizeClasses = {
    sm: "w-3.5 h-3.5",
    md: "w-4 h-4",
    lg: "w-5 h-5",
  };

  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          className={`${sizeClasses[size]} ${
            star <= rating ? "text-yellow-400" : "text-gray-200"
          }`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

/**
 * Rating Breakdown Bar
 */
function RatingBar({ stars, count, total }: { stars: number; count: number; total: number }) {
  const percentage = total > 0 ? (count / total) * 100 : 0;

  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="w-3 text-gray-600">{stars}</span>
      <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
      </svg>
      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-yellow-400 rounded-full transition-all duration-500"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className="w-8 text-right text-gray-500 text-xs">{count}</span>
    </div>
  );
}

/**
 * Individual Review Card
 */
function ReviewCard({ review }: { review: BusinessReview }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const userName = review.user?.name || "Anonymous";
  const content = review.content || "";
  const shouldTruncate = content.length > 200;

  return (
    <div className="py-4 border-b border-gray-100 last:border-0">
      {/* Header */}
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div
          className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-medium text-sm flex-shrink-0 ${getAvatarColor(
            userName
          )}`}
        >
          {getInitials(userName)}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Name and Rating Row */}
          <div className="flex items-center justify-between gap-2 mb-1">
            <h4 className="font-medium text-gray-900 truncate">{userName}</h4>
          </div>

          {/* Rating and Time */}
          <div className="flex items-center gap-2 mb-2">
            {review.rating && <StarRating rating={review.rating} size="sm" />}
            <span className="text-gray-400 text-xs">
              {formatRelativeTime(review.date)}
            </span>
          </div>

          {/* Review Content */}
          {content && (
            <div className="text-gray-700 text-sm leading-relaxed">
              <p className={!isExpanded && shouldTruncate ? "line-clamp-3" : ""}>
                {content}
              </p>
              {shouldTruncate && (
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium mt-1"
                >
                  {isExpanded ? "Show less" : "Read more"}
                </button>
              )}
            </div>
          )}

          {/* Helpful Actions (Google Maps style) */}
          <div className="flex items-center gap-4 mt-3">
            <button className="flex items-center gap-1.5 text-gray-500 hover:text-gray-700 text-xs transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5"
                />
              </svg>
              Helpful
            </button>
            <button className="flex items-center gap-1.5 text-gray-500 hover:text-gray-700 text-xs transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                />
              </svg>
              Share
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Sort options for reviews
 */
type SortOption = "newest" | "highest" | "lowest";

export default function Modal_Review({
  business,
  onClose,
  isLoading = false,
}: ModalReviewProps): React.ReactElement {
  const reviews = business.reviews || [];
  const [sortBy, setSortBy] = useState<SortOption>("newest");

  // Calculate rating breakdown
  const ratingBreakdown = useMemo(() => {
    const breakdown = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach((review) => {
      if (review.rating && review.rating >= 1 && review.rating <= 5) {
        breakdown[review.rating as keyof typeof breakdown]++;
      }
    });
    return breakdown;
  }, [reviews]);

  // Calculate average rating
  const averageRating = useMemo(() => {
    const validRatings = reviews.filter((r) => r.rating !== null);
    if (validRatings.length === 0) return 0;
    const sum = validRatings.reduce((acc, r) => acc + (r.rating || 0), 0);
    return sum / validRatings.length;
  }, [reviews]);

  // Sort reviews
  const sortedReviews = useMemo(() => {
    const sorted = [...reviews];
    switch (sortBy) {
      case "newest":
        return sorted.sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        );
      case "highest":
        return sorted.sort((a, b) => (b.rating || 0) - (a.rating || 0));
      case "lowest":
        return sorted.sort((a, b) => (a.rating || 0) - (b.rating || 0));
      default:
        return sorted;
    }
  }, [reviews, sortBy]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">{business.name}</h2>
            <p className="text-sm text-gray-500">Reviews & Ratings</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="Close"
          >
            <svg
              className="w-5 h-5 text-gray-500"
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
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16 px-6">
              <div className="w-10 h-10 border-4 border-gray-200 border-t-primary-red rounded-full animate-spin mb-4" />
              <p className="text-gray-500 text-sm">Loading reviews...</p>
            </div>
          ) : reviews.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-6">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <svg
                  className="w-8 h-8 text-gray-400"
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
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-1">No reviews yet</h3>
              <p className="text-gray-500 text-sm text-center max-w-xs">
                Be the first to share your experience at this place!
              </p>
            </div>
          ) : (
            <>
              {/* Rating Summary */}
              <div className="px-6 py-5 bg-gradient-to-b from-gray-50 to-white border-b border-gray-100">
                <div className="flex gap-8">
                  {/* Overall Rating */}
                  <div className="flex flex-col items-center">
                    <span className="text-5xl font-semibold text-gray-900">
                      {averageRating.toFixed(1)}
                    </span>
                    <StarRating rating={Math.round(averageRating)} size="md" />
                    <span className="text-sm text-gray-500 mt-1">
                      {reviews.length} review{reviews.length !== 1 ? "s" : ""}
                    </span>
                  </div>

                  {/* Rating Breakdown */}
                  <div className="flex-1 space-y-1.5">
                    {[5, 4, 3, 2, 1].map((stars) => (
                      <RatingBar
                        key={stars}
                        stars={stars}
                        count={ratingBreakdown[stars as keyof typeof ratingBreakdown]}
                        total={reviews.length}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Sort Options */}
              <div className="px-6 py-3 border-b border-gray-100 flex items-center justify-between">
                <span className="text-sm text-gray-600">
                  {reviews.length} review{reviews.length !== 1 ? "s" : ""}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">Sort by:</span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as SortOption)}
                    className="text-sm border-0 bg-transparent text-gray-900 font-medium focus:ring-0 cursor-pointer pr-6"
                  >
                    <option value="newest">Newest</option>
                    <option value="highest">Highest rating</option>
                    <option value="lowest">Lowest rating</option>
                  </select>
                </div>
              </div>

              {/* Reviews List */}
              <div className="px-6 divide-y divide-gray-100">
                {sortedReviews.map((review) => (
                  <ReviewCard key={review.id} review={review} />
                ))}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50">
          <button
            onClick={onClose}
            className="w-full py-2.5 px-4 bg-white border border-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
