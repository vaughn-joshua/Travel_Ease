import React, { useState, useRef, useEffect } from "react";

function Route_Form({ onRouteSubmit }) {
  const [startLocation, setStartLocation] = useState("");
  const [endLocation, setEndLocation] = useState("");

  const [startSuggestions, setStartSuggestions] = useState([]);
  const [endSuggestions, setEndSuggestions] = useState([]);

  const formRef = useRef(null);

  //Hide dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (formRef.current && !formRef.current.contains(event.target)) {
        setStartSuggestions([]);
        setEndSuggestions([]);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);


  
  const fetchCoords = async (address) => {
    const response = await fetch(
          `http://localhost:3001/api/search?query=${encodeURIComponent(query)}`
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
  const handleStartChange = async (e) => {
    const value = e.target.value;
    setStartLocation(value);
    if (value.length < 3) {
      setStartSuggestions([]);
      return;
    }
    try {
      const response = await fetch(`http://localhost:3001/api/suggestions?query=${encodeURIComponent(value)}`);
      const data = await response.json();
      setStartSuggestions(data);
    } catch (error) {
      console.error("Error fetching start suggestions:", error);
    }
  };

  const handleEndChange = async (e) => {
    const value = e.target.value;
    setEndLocation(value);
    if (value.length < 3) {
      setEndSuggestions([]);
      return;
    }
    try {
      const response = await fetch(`http://localhost:3001/api/suggestions?query=${encodeURIComponent(value)}`);
      const data = await response.json();
      setEndSuggestions(data);
    } catch (error) {
      console.error("Error fetching end suggestions:", error);
    }
  };

  // --- 3. ADDED SELECT HANDLERS ---
  const handleStartSelect = (place) => {
    setStartLocation(place.display_name);
    setStartSuggestions([]);
  };

  const handleEndSelect = (place) => {
    setEndLocation(place.display_name);
    setEndSuggestions([]);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white p-3 rounded-md shadow-md mt-3 w-80"
    >
      <h2 className="font-semibold mb-2 text-gray-700">Find Route</h2>
<div className = "relative"> 
      <input
        type="text"
        placeholder="Start location"
        value={startLocation}
        onChange={handleStartChange}
        className="border w-full px-2 py-1 rounded mb-2"
        autoComplete="off"
      />
      {startSuggestions.length > 0 && (
          <ul className="absolute top-full left-0 right-0 bg-white border border-gray-300 rounded-md max-h-60 overflow-y-auto shadow-md z-[100000]">
            {startSuggestions.map((place, index) => (
              <li
                key={index}
                onClick={() => handleStartSelect(place)} // <-- Use new handler
                className="p-2 cursor-pointer hover:bg-gray-100 border-b"
              >
                {place.display_name}
              </li>
            ))}
          </ul>
        )}
</div>
<div className = "relative">
      <input
        type="text"
        placeholder="End location"
        value={endLocation}
        onChange={handleEndChange}
        className="border w-full px-2 py-1 rounded mb-2"
      />
      {endSuggestions.length > 0 && (
          <ul className="absolute top-full left-0 right-0 bg-white border border-gray-300 rounded-md max-h-60 overflow-y-auto shadow-md z-[100000]">
            {endSuggestions.map((place, index) => (
              <li
                key={index}
                onClick={() => handleEndSelect(place)} // <-- Use new handler
                className="p-2 cursor-pointer hover:bg-gray-100 border-b"
              >
                {place.display_name}
              </li>
            ))}
          </ul>
        )}
</div>
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
