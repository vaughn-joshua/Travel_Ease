import { useState, useEffect } from "react";
import { fetch_businesses } from "../../utils/travel_plan/fetch_businesses";
import Business_box from "../../components/Travel_Spots/Business_box";
import Search_Box from "../../components/Travel_Spots/Search_Box";
import type { Business } from "../../types/business";

export default function Main_Travel_Spots(): React.ReactElement {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [filteredBusinesses, setFilteredBusinesses] = useState<Business[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const loadData = async (): Promise<void> => {
      try {
        const data = await fetch_businesses();
        setBusinesses(data);
        setFilteredBusinesses(data);
      } catch (e) {
        console.error("Error loading businesses:", e);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredBusinesses(businesses);
    } else {
      const filtered = businesses.filter(
        (b) =>
          b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          b.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredBusinesses(filtered);
    }
  }, [searchQuery, businesses]);

  const handleSearch = (query: string): void => {
    setSearchQuery(query);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p>Loading travel spots...</p>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Travel Spots</h1>

        <div className="mb-6">
          <Search_Box onSearch={handleSearch} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBusinesses.length === 0 ? (
            <p className="text-gray-500 col-span-full text-center">
              No travel spots found
            </p>
          ) : (
            filteredBusinesses.map((business) => (
              <Business_box key={business.id} business={business} />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

