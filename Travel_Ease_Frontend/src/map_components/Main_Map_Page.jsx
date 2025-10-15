import React, { useState, useEffect } from "react";
// import "./App.css";
import Map_Page from "./Map_Page.jsx";
import Search_Box from "./Search_Box.jsx";

function Main_Map_Page(){

const [search_result, set_search_result] = useState(null);



    return(
        <>
        <div> 
            <Search_Box onSearch = {set_search_result} />
        </div>
        <div className = "current-location">
            <input 
            type = "button"
            value = "📍 Current Location"
            onClick = {()=> {
                navigator.geolocation.getCurrentPosition((success) => {
                    const { latitude, longitude } = success.coords;
                    set_search_result([latitude, longitude]);
                })
            }}
            />
        </div>
        <Map_Page search_result = {search_result}></Map_Page>
        </>


    )
}

export default Main_Map_Page; 