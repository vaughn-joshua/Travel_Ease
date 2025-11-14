import React, { useState, useEffect } from "react";
// import "./App.css";
import Map_Page from "./Map_Page.jsx";
import Search_Box from "./Search_Box.jsx";
import Route_Form from "./Route_Form.jsx";

function Main_Map_Page(){
    const [search_result, set_search_result] = useState(null);
    const [start, setStart] = useState(null);
    const [end, setEnd] = useState(null);

    const handleRouteSubmit = ({start, end}) => {
        setStart(start);
        setEnd(end);
    }
    const handleClearMap = () => {
    set_search_result(null);
    setStart(null);
    setEnd(null);
    console.log("Map Cleared!");
  };

    return(
        <>
        {/* Search bar + Route form */}
        <div className="relative z-[1000] w-full"> 
        <div className="absolute top-3 left-3 z-[9999] flex flex-col gap-2"> 
            <Search_Box onSearch = {set_search_result} />
            <Route_Form onRouteSubmit = {handleRouteSubmit} />
        </div>
        {/* Current location button */}
        <div className = "absolute current-location">
            <input 
            className = "p-1.5 rounded-md border border-gray-300 bg-white hover:bg-gray-100 cursor-pointer fixed bottom-25 right-2 z-[9999] shadow-md"
            type = "button"
            value = "📍"
            onClick = {()=> {
                navigator.geolocation.getCurrentPosition((success) => {
                    const { latitude, longitude } = success.coords;
                    set_search_result([latitude, longitude]);
                })
            }}
            />
        </div>
        
        </div> 
 
        <Map_Page search_result = {search_result} start = {start} end = {end} onMapClear={handleClearMap}>
            
        </Map_Page>

      
        </>


    )
}

export default Main_Map_Page; 