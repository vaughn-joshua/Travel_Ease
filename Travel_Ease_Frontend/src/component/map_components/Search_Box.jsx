import React, { useState, useRef, useEffect } from "react";

function Search_Box({ onSearch }) {
  const [query, set_query] = useState("");
  const [suggestions, set_suggestions] = useState([]);
  const boxRef = useRef(null);
  const timeRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (boxRef.current && !boxRef.current.contains(event.target)) {
        set_suggestions([]); // hide suggestions when clicked/tapped outside
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, []);

  const handleInputChange = async (e) => {
    const value = e.target.value;
    set_query(value);

    clearTimeout(timeRef.current);

    if (value.length < 3) {
      set_suggestions([]);
      return;
    }

    timeRef.current = setTimeout(async () => {
      try {
        const response = await fetch(
          `http://localhost:3001/api/suggestions?query=${encodeURIComponent(
            value
          )}`
        );
        const data = await response.json();
        set_suggestions(data);
      } catch (error) {
        console.error("Error fetching suggestions:", error);
      }
    }, 500);
  };

  const handleSelect = (place) => {
    const parts = place.display_name.split(",").map((i) => i.trim());

    const name = parts[0]; // People's Park in the Sky
    const barangay = parts[1]; // Iruhin South
    const city = parts[2]; // Tagaytay
    const province = parts[3]; // Cavite

    const lat = parseFloat(place.lat);
    const lon = parseFloat(place.lon);

    set_query(place.display_name);
    set_suggestions([]);
    onSearch([lat, lon, name, barangay, city, province]);
  };

  const Handle_Search = async (e) => {
    e.preventDefault();

    const response = await fetch(
      `http://localhost:3001/api/search?query=${encodeURIComponent(query)}`
    );
    const data = await response.json();
    if (data[0]) {
      const lat = parseFloat(data[0].lat);
      const lon = parseFloat(data[0].lon);
      onSearch([lat, lon]);
    } else {
      alert("Location not found");
    }
  };

  return (
    <div ref={boxRef} className="relative w-[300px] z-[99999]">
      <div
        onSubmit={Handle_Search}
        className="flex bg-white rounded-md shadow-md z-[9999] relative"
      >
        <input
          ref={boxRef}
          type="text"
          placeholder="Search for a place..."
          value={query}
          onChange={handleInputChange}
          style={
            {
              // padding: "10px",
              // width: "100%",
              // borderRadius: "8px",
              // border: "1px solid #ccc",
            }
          }
          className="p-2 w-full rounded-md border border-gray-300"
        />
        <button
          type="submit"
          className="m-2 p-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
        >
          🔍
        </button>
      </div>

      {/* Suggestion dropdown */}
      {suggestions.length > 0 && (
        <ul
          // style={{
          //   position: "absolute",
          //   top: "100%",
          //   left: 0,
          //   right: 0,
          //   background: "#fff",
          //   border: "1px solid #ccc",
          //   borderTop: "none",
          //   borderRadius: "0 0 8px 8px",
          //   maxHeight: "200px",
          //   overflowY: "auto",
          //   zIndex: 1000,
          //   listStyle: "none",
          //   margin: 0,
          //   padding: 0,

          // }}
          className="absolute top-full left-0 right-0 bg-white border border-gray-300 rounded-md max-h-60 overflow-y-auto shadow-md z-[100000]"
        >
          {suggestions.map((place, index) => (
            <li
              key={index}
              onClick={() => handleSelect(place)}
              style={{
                padding: "10px",
                cursor: "pointer",
                borderBottom: "1px solid #eee",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = "#f2f2f2")
              }
              onMouseLeave={(e) => (e.currentTarget.style.background = "white")}
            >
              <span style={{ fontSize: "16px" }}>📍</span>
              <span>
                <strong>{place.display_name.split(",")[0]}</strong>
                <br />
                <small style={{ color: "#555" }}>
                  {place.display_name.split(",").slice(1).join(", ")}
                </small>
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default Search_Box;
