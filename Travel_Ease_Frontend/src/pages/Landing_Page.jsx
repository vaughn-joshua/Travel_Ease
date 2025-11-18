import React from "react";
import Pin_Icon from "../assets/pin.png";
import Man from "../assets/man.png";
import "leaflet/dist/leaflet.css";
import { MapContainer, Marker, TileLayer, ZoomControl } from "react-leaflet";
import L, { Icon } from "leaflet";
//import MarkerClusterGroup from "";
import "leaflet-routing-machine";
import { Map_Mover } from "../components/map_components/Map_Mover.jsx";
import "leaflet-routing-machine/dist/leaflet-routing-machine.css";
import Routing_Machine from "../components/map_components/Routing_Machine.jsx";

function Landing_Page({className, start, end}) {
const Tagaytay_Center = [14.1154, 120.9620];
const zoom = 14;
const Max_Zoom = 13;
const Max_Bounds = [[14.052170, 120.876775],
                    [14.182010, 121.048989]];


// const [boundary_data, set_boundary_data] = useState(null);
const custom_icon = new Icon({
    iconUrl: Pin_Icon,
    iconSize:[30,30] 
})
const custom_icon_person = new Icon({
    iconUrl: Man,
    iconSize:[30,30] 
})
// const routePositions = start && end ? [start, end] : null;

    return(
        <>
       <div className={className}>
            <MapContainer center = {Tagaytay_Center} 
                          zoom = {zoom} 
                          maxBounds = {Max_Bounds}
                          maxBoundsViscosity = {1.0}
                          minZoom = {Max_Zoom}
                          zoomControl = {false}
                          className = "w-full h-full"
                          >
                            
                <TileLayer 
                    attribution= '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url = 'https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png'
                />
                <ZoomControl position="bottomright" />
                {/* {search_result && (
                    <Marker position = {search_result} icon = {custom_icon}> 
                    <Popup>📍 You searched here!</Popup>
                    </Marker>
                )} */}
            {start && (
                <Marker position= {start} icon = {custom_icon_person} />
            )}
            {end && (   
                <Marker position= {end} icon = {custom_icon} />
            )}
            

            {/* <Map_Mover position = {search_result} /> */}
            <Routing_Machine start={start} end={end} />
            </MapContainer>
     </div>
        </>
    );
}
export default Landing_Page;