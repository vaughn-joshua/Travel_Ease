import React, { useState } from "react";
import Search_Box from "./Search_Box";
import type { SearchResult, RouteSubmission } from "../../types/map";

interface RouteFormProps {
  onRouteSubmit: (route: RouteSubmission) => void;
}

export default function Route_Form({ onRouteSubmit }: RouteFormProps): React.ReactElement {
  const [startPoint, setStartPoint] = useState<SearchResult | null>(null);
  const [endPoint, setEndPoint] = useState<SearchResult | null>(null);

  const handleSubmit = (e: React.FormEvent): void => {
    e.preventDefault();
    if (startPoint && endPoint) {
      onRouteSubmit({
        start: { lat: startPoint.lat, lng: startPoint.lng, name: startPoint.name },
        end: { lat: endPoint.lat, lng: endPoint.lng, name: endPoint.name },
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-3 rounded-lg shadow-md space-y-2">
      <div>
        <label className="text-xs text-gray-600">From:</label>
        <Search_Box onSearch={setStartPoint} placeholder="Start location" />
        {startPoint && (
          <p className="text-xs text-green-600 mt-1">✓ {startPoint.name}</p>
        )}
      </div>
      <div>
        <label className="text-xs text-gray-600">To:</label>
        <Search_Box onSearch={setEndPoint} placeholder="Destination" />
        {endPoint && (
          <p className="text-xs text-green-600 mt-1">✓ {endPoint.name}</p>
        )}
      </div>
      <button
        type="submit"
        disabled={!startPoint || !endPoint}
        className="w-full hard_btn disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Get Route
      </button>
    </form>
  );
}

