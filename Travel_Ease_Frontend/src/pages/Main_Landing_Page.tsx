import Landing_Page from "./Landing_Page";
import React, { useState } from "react";

interface RouteData {
  start: [number, number];
  end: [number, number];
}

export default function Main_Landing_Page(): React.ReactElement {
  const [start, setStart] = useState<[number, number] | null>(null);
  const [end, setEnd] = useState<[number, number] | null>(null);

  const handleShowRoute = (routeData: RouteData): void => {
    setStart(routeData.start);
    setEnd(routeData.end);
  };

  const itineraryRoute: RouteData = {
    start: [14.1154, 120.9618],
    end: [14.0953, 120.9376],
  };

  const handleItineraryClick = (): void => {
    handleShowRoute(itineraryRoute);
  };

  return (
    <div className="w-4xl h-1/3 grid grid-cols-12 gap-3 bg-[#f7faf8] p-4 rounded-lg">
      <Landing_Page
        start={start}
        end={end}
        className="w-full h-full grid col-span-8"
      />
      <div className="col-span-4">
        <h1 className="text-lg">Day 1</h1>
        <div
          onClick={handleItineraryClick}
          className="flex flex-col gap-2 hover:shadow-lg p-2 rounded-lg bg-white cursor-pointer"
        >
          <div>____ Plan </div>
          <div className="grid grid-cols-12 gap-2">
            <div className="col-span-3">
              <img src="https://placehold.co/100x100" alt="placeholder" />
            </div>
            <div className="col-span-9 flex flex-col">
              <div className="t-sm p-1">Category</div>
              <div className="grid grid-cols-1 gap-x-4">
                <div className="flex flex-col mr-4">
                  <div className="flex justify-between mb-2">
                    <div>Place Name</div>
                    <div>Budget</div>
                  </div>
                  <div className="flex justify-between mb-2">
                    <div>Location</div>
                    <div>Date & Time</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

