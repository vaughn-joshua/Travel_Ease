import React, { useState, useEffect } from "react";
import "./App.css";
import { Map_Page } from "./Map_Page.jsx";
import { Search_Box } from "./Search_Box.jsx"

function Main_Map_Page(){

const [search_result, set_search_result] = useState(null);



    return(
        <>
        <div> 
            <Search_Box onSearch = {set_search_result} />
        </div>
        </>


    )
}

export default Main_Map_Page; 