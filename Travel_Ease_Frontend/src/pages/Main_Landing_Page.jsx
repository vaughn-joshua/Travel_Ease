import Landing_Page from "./Landing_Page.jsx";
import React, { useState } from "react";

function Main_Landing_Page() {
  const [start, setStart] = useState(null);
  const [end, setEnd] = useState(null);

  // 2. This is the handler called when the itinerary list item is clicked
  const handleShowRoute = (routeData) => {
    setStart(routeData.start);
    setEnd(routeData.end);
    // Note: You may want to add logic here to center the map using Map_Mover
  };

  // Example Route Data (Defined locally for now)
  const itineraryRoute = {
    start: [14.1154, 120.9618], // Tagaytay Rotonda
    end: [14.0953, 120.9376], // Sky Ranch
  };

  const handleItineraryClick = () => {
    // 3. The list item now calls the local handler
    handleShowRoute(itineraryRoute);
  };
  return (
    <>
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
            className="flex flex-col gap-2 hover:shadow-lg p-2 rounded-lg bg-white"
          >
            <div>____ Plan </div>
            <div className="grid grid-cols-12 gap-2">
              <div className="col-span-3">
                <img src="https://placehold.co/100x100" />
              </div>
              <div className="col-span-9 flex flex-col ">
                <div className="t-sm p-1">Category</div>
                <div className="grid grid-cols-1 gap-x-4">
                  <div className="flex flex-col mr-4">
                    <div className="flex justify-between mb-2">
                      <div>Place Name</div>
                      <div>Budget </div>
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
    </>
  );
}
export default Main_Landing_Page;
