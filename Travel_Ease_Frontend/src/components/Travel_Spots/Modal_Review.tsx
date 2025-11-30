import type { Business, BusinessReview } from "../../types/business";

interface ModalReviewProps {
  business: Business;
  onClose: () => void;
}

export default function Modal_Review({
  business,
  onClose,
}: ModalReviewProps): React.ReactElement {
  const reviews = business.reviews || [];

  return (
    <div className="modal" onClick={onClose}>
      <div className="modal_body" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">{business.name} - Reviews</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            ✕
          </button>
        </div>

        {reviews.length === 0 ? (
          <p className="text-center text-gray-500 py-8">No reviews yet</p>
        ) : (
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {reviews.map((review) => (
              <div key={review.id} className="border-b border-gray-200 pb-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium">
                    {review.user?.name || "Anonymous"}
                  </span>
                  {review.rating && (
                    <span className="text-yellow-500">
                      {"★".repeat(review.rating)}
                      {"☆".repeat(5 - review.rating)}
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-600">
                  {review.content || "No comment"}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  {new Date(review.date).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        )}

        <div className="mt-4 flex justify-end">
          <button onClick={onClose} className="soft_btn">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

