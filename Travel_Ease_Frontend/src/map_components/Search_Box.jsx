import React, {useState} from "react";
import Button_Route from "./Button_Route.jsx";
function Search_Box({ onSearch }){
const [query, set_query] = useState("");
const [suggestions, set_suggestions] = useState([]);

const handleInputChange = async (e)=> {
    const value = e.target.value;
    set_query(value);

    if(value.length < 3){
        set_suggestions([]);
        return;
    }
    try {
        const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${value},Tagaytay%20City&countrycodes=ph&limit=5`);
        const data = await response.json();
        set_suggestions(data);
    } catch (error) {
        console.error("Error fetching suggestions:", error);
    }
};

const handleSelect = (place)=>{
    const lat = parseFloat(place.lat);
    const lon = parseFloat(place.lon);
    set_query(place.display_name);
    set_suggestions([]);
    onSearch([lat, lon]);
}

const  Handle_Search = async (e)=>{
    e.preventDefault();

    const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${query},Tagaytay%20City&countrycodes=ph&bounded=1&viewbox=120.92,14.15,120.97,14.07`);
    const data = await response.json();
    if (data[0]){
        const lat = parseFloat(data[0].lat);
        const lon = parseFloat(data[0].lon);
            onSearch([lat,lon]);
        }else{
            alert("Location not found");
        }
    };

    return(
    <div style={{ width: "300px" }}>
      <form onSubmit={Handle_Search} className = "flex bg-white rounded-md shadow-md relative z-[9999]">
        <input
          type="text"
          placeholder="Search for a place..."
          value={query}
          onChange={handleInputChange}
          style={{
            // padding: "10px",
            // width: "100%",
            // borderRadius: "8px",
            // border: "1px solid #ccc",
          }}
          className = "p-2 w-full rounded-md border border-gray-300"
        />
        <button type="submit" className = "m-2 p-2 bg-blue-500 text-white rounded-md hover:bg-blue-600">
          🔍
        </button>
      </form>

      {/* Suggestion dropdown */}
      {suggestions.length > 0 && (
        <ul
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            right: 0,
            background: "#fff",
            border: "1px solid #ccc",
            borderTop: "none",
            borderRadius: "0 0 8px 8px",
            maxHeight: "200px",
            overflowY: "auto",
            zIndex: 1000,
            listStyle: "none",
            margin: 0,
            padding: 0,
          }}
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

      <Button_Route />
    </div>

    )


}

export default Search_Box;