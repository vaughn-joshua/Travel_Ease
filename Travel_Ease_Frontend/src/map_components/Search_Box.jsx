import React, {useState} from "react";


function Search_Box({ onSearch }){
const [query, set_query] = useState("");

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
        <form onSubmit = {Handle_Search}>
            <input 
                type = "text"
                placeholder ="Search for a place..."
                value = {query}
                onChange = {(e)=> set_query(e.target.value)}
                style = {{padding: "8px", width: "250px"}}
            />   
            <button type = "submit" style={{ marginLeft: "5px" }}>Search</button>
        </form>

    )


}

export default Search_Box;