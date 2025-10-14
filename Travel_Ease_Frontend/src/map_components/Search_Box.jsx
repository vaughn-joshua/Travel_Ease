import React, {useState} from "react";


function Search_Box({ onSearch }){
const [search_result, set_search_result] = useState(null);

function Handle_Search(event){
    const [query, set_query] = useState("");

    const search = async (e)=> {
        e.preventDefault();
        const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${query},Marikina&countrycodes=ph&bounded=1&viewbox=121.06,14.71,121.14,14.58`);
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
return(
<>
  <div className = "search-bar" style = {{padding: "10px"}}>
    <Search_Box onSearch = {set_search_result}/> 
  </div>
</>


)    

}

export default Search_Box;