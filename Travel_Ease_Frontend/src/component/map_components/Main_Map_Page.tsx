import React, { useState } from "react";
import Map_Page from "./Map_Page";
import Search_Box from "./Search_Box";
import Route_Form from "./Route_Form";
import type { SearchResult, RouteSubmission } from "../../types/map";

export default function Main_Map_Page(): React.ReactElement {
  const [search_result, set_search_result] = useState<SearchResult | null>(null);
  const [start, setStart] = useState<[number, number] | null>(null);
  const [end, setEnd] = useState<[number, number] | null>(null);

  const handleRouteSubmit = ({ start: startPoint, end: endPoint }: RouteSubmission): void => {
    setStart([startPoint.lat, startPoint.lng]);
    setEnd([endPoint.lat, endPoint.lng]);
  };

  const handleClearMap = (): void => {
    set_search_result(null);
    setStart(null);
    setEnd(null);
    console.log("Map Cleared!");
  };

  const handleSearch = (result: SearchResult): void => {
    set_search_result(result);
  };

  const getSearchPosition = (): [number, number] | null => {
    if (!search_result) return null;
    return [search_result.lat, search_result.lng];
  };

  return (
    <div className="h-[calc(100vh-64px)] w-full">  {/* Add height wrapper - adjust 64px for your navbar height */}
      <div className="relative z-[1000] w-full">
        <div className="absolute top-3 left-3 z-[9999] flex flex-col gap-2">
          <Search_Box onSearch={handleSearch} />
          <Route_Form onRouteSubmit={handleRouteSubmit} />
        </div>
        <div className="absolute current-location">
          <input
            className="p-1.5 rounded-md border border-gray-300 bg-white hover:bg-gray-100 cursor-pointer fixed bottom-25 right-2 z-[9999] shadow-md"
            type="button"
            value="📍"
            onClick={() => {
              navigator.geolocation.getCurrentPosition((success) => {
                const { latitude, longitude } = success.coords;
                set_search_result({
                  lat: latitude,
                  lng: longitude,
                  name: "Current Location",
                  label: "Current Location",
                });
              });
            }}
          />
        </div>
      </div>

      <Map_Page
        search_result={getSearchPosition()}
        start={start}
        end={end}
        onMapClear={handleClearMap}
      />
    </div>
  );
}

