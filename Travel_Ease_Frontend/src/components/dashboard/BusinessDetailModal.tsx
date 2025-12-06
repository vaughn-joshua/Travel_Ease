import React from "react";
import { Link } from "react-router-dom";

interface Business {
  business_id: number;
  name: string;
  description?: string | null;
  city?: string | null;
  brgy?: string | null;
  street?: string | null;
  house_number?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  rating?: number | null;
  picture?: string | null;
  categories?: { category_name: string }[];
}

interface BusinessDetailModalProps {
  business: Business;
  canEdit: boolean;
  onClose: () => void;
  onAddToPlan: () => void;
}

export default function BusinessDetailModal({
  business,
  canEdit,
  onClose,
  onAddToPlan,
}: BusinessDetailModalProps): React.ReactElement {
  // Build full address
  const addressParts = [
    business.house_number,
    business.street,
    business.brgy,
    business.city,
  ].filter(Boolean);
  const fullAddress = addressParts.join(", ") || "No address available";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="relative bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 max-h-[80vh] overflow-hidden">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 bg-white/80 hover:bg-white rounded-full shadow-lg transition-colors"
        >
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Business Image */}
        <div className="h-48 bg-gray-200 relative">
          {business.picture ? (
            <img
              src={business.picture}
              alt={business.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              <svg className="w-20 h-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
          )}
          {/* Rating Badge */}
          {business.rating && (
            <div className="absolute bottom-3 left-3 flex items-center gap-1.5 bg-white/95 backdrop-blur-sm px-2.5 py-1.5 rounded-lg shadow">
              <svg className="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <span className="font-semibold text-gray-900">{Number(business.rating).toFixed(1)}</span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto max-h-[calc(80vh-12rem)]">
          {/* Name */}
          <h2 className="text-xl font-bold text-gray-900 mb-2">{business.name}</h2>

          {/* Categories */}
          {business.categories && business.categories.length > 0 && (
            <div className="flex gap-2 flex-wrap mb-3">
              {business.categories.map((cat, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-1 text-xs font-medium bg-red-50 text-red-600 rounded-full"
                >
                  {cat.category_name}
                </span>
              ))}
            </div>
          )}

          {/* Address */}
          <div className="flex items-start gap-2 text-gray-600 mb-4">
            <svg className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="text-sm">{fullAddress}</span>
          </div>

          {/* Description */}
          {business.description && (
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-1">About</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                {business.description}
              </p>
            </div>
          )}

          {/* View Full Details Link */}
          <Link
            to={`/businesses/${business.business_id}`}
            className="inline-flex items-center gap-1 text-sm text-red-600 hover:text-red-700 hover:underline mb-4"
          >
            View full details
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        {/* Action Buttons */}
        <div className="border-t border-gray-200 p-4 bg-gray-50 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 px-4 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-100 transition-colors"
          >
            Close
          </button>
          {canEdit && (
            <button
              onClick={onAddToPlan}
              className="flex-1 py-2.5 px-4 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add to Plan
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

