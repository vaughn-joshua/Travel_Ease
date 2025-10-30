import React, { useState } from "react";

function Route_Form({ onRouteSubmit }) {
  const [startLocation, setStartLocation] = useState("");
  const [endLocation, setEndLocation] = useState("");

  const fetchCoords = async (address) => {
    const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
      address
    )},Tagaytay%20City&countrycodes=ph&bounded=1&viewbox=120.92,14.15,120.97,14.07`
    );
    const data = await response.json();
    return data.length > 0
      ? [parseFloat(data[0].lat), parseFloat(data[0].lon)]
      : null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!startLocation.trim() || !endLocation.trim()) {
      alert("Please enter both starting point and destination.");
      return;
    }

    const startCoords = await fetchCoords(startLocation);
    const endCoords = await fetchCoords(endLocation);

    if (startCoords && endCoords) {
      onRouteSubmit({ start: startCoords, end: endCoords });
    } else {
      alert("Could not find coordinates for one or both locations.");
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white p-3 rounded-md shadow-md mt-3 w-80"
    >
      <h2 className="font-semibold mb-2 text-gray-700">Find Route</h2>

      <input
        type="text"
        placeholder="Start location"
        value={startLocation}
        onChange={(e) => setStartLocation(e.target.value)}
        className="border w-full px-2 py-1 rounded mb-2"
      />

      <input
        type="text"
        placeholder="End location"
        value={endLocation}
        onChange={(e) => setEndLocation(e.target.value)}
        className="border w-full px-2 py-1 rounded mb-2"
      />

      <button
        type="submit"
        className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded w-full"
      >
        Show Route
      </button>
    </form>
  );
}

export default Route_Form;
