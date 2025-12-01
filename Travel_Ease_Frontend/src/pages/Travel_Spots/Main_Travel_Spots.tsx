import { useState, useEffect, useRef } from "react";
import { fetch_businesses } from "../../utils/travel_plan/fetch_businesses";
import Business_box from "../../components/Travel_Spots/Business_box";
import Search_Box from "../../components/Travel_Spots/Search_Box";
import { useDebouncedValue } from "../../hooks/useDebouncedValue";
import type { Business } from "../../types/business";

export default function Main_Travel_Spots(): React.ReactElement {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Debounce search input to avoid excessive API calls
  const debouncedSearch = useDebouncedValue(searchQuery, 350);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    // Abort any in-flight request when search changes or component unmounts
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    const loadData = async (): Promise<void> => {
      try {
        setLoading(true);
        setError(null);
        const data = await fetch_businesses({
          search: debouncedSearch || undefined,
          signal: controller.signal,
        });
        setBusinesses(data);
      } catch (e: any) {
        // Ignore aborted requests
        if (e.name === "CanceledError" || e.code === "ERR_CANCELED") {
          return;
        }
        if (import.meta.env.DEV) {
          console.error("Error loading businesses:", e);
        }
        setError("Failed to load travel spots. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    loadData();

    return () => {
      controller.abort();
    };
  }, [debouncedSearch]);

  const handleSearch = (query: string): void => {
    setSearchQuery(query);
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Travel Spots</h1>

        <div className="mb-6">
          <Search_Box onSearch={handleSearch} />
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
            <button
              onClick={() => setSearchQuery(searchQuery)} // triggers refetch via effect
              className="btn-primary"
            >
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
                <Business_box key={business.id} business={business} />
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}

