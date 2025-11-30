import { useState } from "react";
import Modal_Review from "./Modal_Review";
import type { Business } from "../../types/business";

interface BusinessBoxProps {
  business: Business;
}

export default function Business_box({ business }: BusinessBoxProps): React.ReactElement {
  const [showReviews, setShowReviews] = useState<boolean>(false);

  return (
    <>
      <div className="card hover:shadow-lg transition-shadow cursor-pointer">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-semibold text-lg">{business.name}</h3>
          {business.rating && (
            <span className="text-yellow-500">★ {business.rating.toFixed(1)}</span>
          )}
        </div>

        <p className="text-sm text-gray-600 mb-2 line-clamp-2">
          {business.description || "No description available"}
        </p>

        <div className="flex flex-wrap gap-1 mb-2">
          {business.categories?.map((cat) => (
            <span
              key={cat.id}
              className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded"
            >
              {cat.name}
            </span>
          ))}
        </div>

        <p className="text-sm text-gray-500 mb-2">
          {business.location?.address || "Location not available"}
        </p>

        {business.priceRange && (
          <p className="text-sm text-green-600">
            ₱{business.priceRange.min} - ₱{business.priceRange.max}
          </p>
        )}

        <div className="mt-3 flex gap-2">
          <button
            onClick={() => setShowReviews(true)}
            className="soft_btn text-sm"
          >
            Reviews ({business.reviewCount || 0})
          </button>
        </div>
      </div>

      {showReviews && (
        <Modal_Review
          business={business}
          onClose={() => setShowReviews(false)}
        />
      )}
    </>
  );
}

