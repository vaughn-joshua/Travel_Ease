import { useState } from "react";
import BusinessBox from "../../components/travel-spots/BusinessBox";
import SpotSearchBox from "../../components/travel-spots/SpotSearchBox";
import { useDebouncedValue } from "../../hooks/useDebouncedValue";
import { useTravelSpots } from "../../features/businesses/queries";

export default function MainTravelSpots(): React.ReactElement {
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Debounce search input to avoid excessive API calls
  const debouncedSearch = useDebouncedValue(searchQuery, 350);

  // Use TanStack Query for fetching travel spots
  const {
    data: travelSpotsData,
    isLoading: loading,
    isError,
    error: queryError,
    refetch,
  } = useTravelSpots({ search: debouncedSearch || undefined });

  const businesses = travelSpotsData?.data || [];
  const error = isError
    ? queryError?.message || "Failed to load travel spots. Please try again."
    : null;

  const handleSearch = (query: string): void => {
    setSearchQuery(query);
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Travel Spots</h1>

        <div className="mb-6">
          <SpotSearchBox onSearch={handleSearch} />
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-b-2 border-primary-red" />
              <p className="text-gray-600">Loading travel spots...</p>
            </div>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-600 mb-4">{error}</p>
            <button onClick={() => refetch()} className="btn-primary">
              Retry
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {businesses.length === 0 ? (
              <p className="text-gray-500 col-span-full text-center">
                No travel spots found
              </p>
            ) : (
              businesses.map((business) => (
                <BusinessBox key={business.business_id} business={business} />
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
