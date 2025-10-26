import React, {useState} from "react";
import Pin_Icon from "../assets/pin.png";
import "leaflet/dist/leaflet.css";
import { MapContainer, Marker, TileLayer, Popup, useMap, GeoJSON, ZoomControl} from "react-leaflet";
import L, { Icon } from "leaflet";
//import MarkerClusterGroup from "";

import { Map_Mover } from "./Map_Mover.jsx";


function Map_Page({ search_result }){

    
const Tagaytay_Center = [14.1154, 120.9620];
const zoom = 13;
const Max_Zoom = 13;
const Max_Bounds = [[14.052170, 120.876775],
                    [14.182010, 121.048989]];

const [boundary_data, set_boundary_data] = useState(null);
const custom_icon = new Icon({
    iconUrl: Pin_Icon,
    iconSize:[30,30] 
})


    return(
        <>
            <MapContainer center = {Tagaytay_Center} 
                          zoom = {zoom} 
                          style = {{height: "90vh", width: "100%"}}
                          maxBounds = {Max_Bounds}
                          maxBoundsViscosity = {1.0}
                          minZoom = {Max_Zoom}
                          zoomControl = {false}
                          className = "static"
                          >
                            
                <TileLayer 
                    attribution= '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url = 'https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png'
                />
                <ZoomControl position="bottomright" />
                {search_result && (
                    <Marker position = {search_result} icon = {custom_icon}> 
                    <Popup>📍 You searched here!</Popup>
                    </Marker>
                )}
            <Map_Mover position = {search_result} />
            </MapContainer>
        </>

    );
}

export default Map_Page;