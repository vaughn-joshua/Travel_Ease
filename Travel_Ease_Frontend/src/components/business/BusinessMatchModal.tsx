import React, { useState } from "react";

interface MatchedBusiness {
  business_id: number;
  name: string;
  city: string;
  brgy: string | null;
  street: string | null;
  house_number: string | null;
  latitude: number;
  longtitude: number;
  picture: string | null;
  rating: number;
  description: string | null;
  status: string;
}

interface BusinessMatchModalProps {
  isOpen: boolean;
  matches: MatchedBusiness[];
  onConfirm: (business: MatchedBusiness) => void;
  onDeny: () => void;
  isLoading: boolean;
}

/**
 * BusinessMatchModal
 * 
 * Displays a list of matching businesses found during registration.
 * User can confirm which one is theirs (claim flow) or deny all (new business flow).
 */
export default function BusinessMatchModal({
  isOpen,
  matches,
  onConfirm,
  onDeny,
  isLoading
}: BusinessMatchModalProps) {
  const [selectedId, setSelectedId] = useState<number | null>(
    matches.length > 0 ? matches[0].business_id : null
  );

  if (!isOpen) return null;

  const selectedBusiness = matches.find(b => b.business_id === selectedId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
      <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto pointer-events-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-primary-red to-red-600 text-white p-6 border-b">
          <h2 className="text-2xl font-bold">We found matching businesses!</h2>
          <p className="text-red-100 mt-2">Is one of these the business you want to register?</p>
        </div>

        {/* Content */}
        <div className="p-6">
          {matches.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No matches found</p>
          ) : (
            <div className="space-y-4">
              {/* Matches List */}
              <div className="space-y-3">
                {matches.map((business) => (
                  <label
                    key={business.business_id}
                    className="flex items-start p-4 border-2 rounded-lg cursor-pointer transition-all"
                    style={{
                      borderColor: selectedId === business.business_id ? '#dc2626' : '#e5e7eb',
                      backgroundColor: selectedId === business.business_id ? '#fef2f2' : '#ffffff'
                    }}
                  >
                    <input
                      type="radio"
                      name="business-match"
                      value={business.business_id}
                      checked={selectedId === business.business_id}
                      onChange={(e) => setSelectedId(parseInt(e.target.value))}
                      className="mt-1 w-5 h-5 text-primary-red cursor-pointer"
                    />
                    <div className="ml-4 flex-1">
                      <div className="flex items-center gap-3">
                        {business.picture && (
                          <img
                            src={business.picture}
                            alt={business.name}
                            className="w-16 h-16 rounded object-cover"
                          />
                        )}
                        <div className="flex-1">
                          <h3 className="font-bold text-lg text-gray-900">
                            {business.name}
                          </h3>
                          <div className="text-sm text-gray-600 mt-1">
                            {business.house_number && (
                              <p>{business.house_number}</p>
                            )}
                            {business.street && (
                              <p>{business.street}</p>
                            )}
                            {business.brgy && (
                              <p>{business.brgy}</p>
                            )}
                            <p className="font-medium">{business.city}</p>
                          </div>
                          {business.rating && (
                            <div className="text-sm font-medium text-primary-red mt-1">
                              ⭐ Rating: {business.rating}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </label>
                ))}
              </div>

              {/* Selected Business Details */}
              {selectedBusiness && (
                <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <h4 className="font-bold text-gray-900 mb-2">Business Details</h4>
                  {selectedBusiness.description && (
                    <p className="text-sm text-gray-600 mb-2">
                      {selectedBusiness.description.substring(0, 150)}
                      {selectedBusiness.description.length > 150 ? "..." : ""}
                    </p>
                  )}
                  <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                    <div>
                      <span className="font-medium">Status:</span> {selectedBusiness.status}
                    </div>
                    <div>
                      <span className="font-medium">Coordinates:</span> {selectedBusiness.latitude.toFixed(4)}, {selectedBusiness.longtitude.toFixed(4)}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer - Actions */}
        <div className="sticky bottom-0 bg-gray-100 border-t p-6 flex gap-3 justify-end">
          <button
            onClick={onDeny}
            disabled={isLoading}
            className="px-6 py-2 rounded-lg border-2 border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            No, Different Business
          </button>
          <button
            onClick={() => {
              if (selectedBusiness) {
                onConfirm(selectedBusiness);
              }
            }}
            disabled={isLoading || !selectedBusiness}
            className="px-6 py-2 rounded-lg bg-primary-red text-white font-semibold hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            {isLoading ? (
              <>
                <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Confirming...
              </>
            ) : (
              <>
                ✓ Yes, This Is Mine
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
