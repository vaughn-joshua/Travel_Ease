import React, { useState, useEffect } from "react";
// import "./App.css";
import Map_Page from "./Map_Page.jsx";
import Search_Box from "./Search_Box.jsx";
function Main_Map_Page(){

const [search_result, set_search_result] = useState(null);



    return(
        <>
        <div className="relative z-[1000] w-full"> 
        <div className="absolute top-3 left-3 z-[9999]"> 
            <Search_Box onSearch = {set_search_result} />
        </div>
        <div className = "current-location">
            <input 
            className = "p-1.5 rounded-md border border-gray-300 bg-white hover:bg-gray-100 cursor-pointer absolute bottom-25 right-2 z-1000 shadow-md"
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
 
        <Map_Page search_result = {search_result}></Map_Page>

      
        </>


    )
}

export default Main_Map_Page; 