import React, {useState} from "react";
//import Pin_Icon from "";
import "leaflet/dist/leaflet.css";
import { MapContainer, Marker, TileLayer, Popup, useMap, GeoJSON } from "react-leaflet";
import L, { Icon } from "leaflet";
//import MarkerClusterGroup from "";

function Map_Page(){

const Tagaytay_Center = [14.1154, 120.9620];
const zoom = 13;
const Max_Zoom = 13;
const Max_Bounds = [[14.052170, 120.876775],
                    [14.182010, 121.048989]];



    return(
        <>
            <MapContainer center = {Tagaytay_Center} 
                          zoom = {zoom} 
                          style = {{height: "90vh", width: "100%"}}
                          maxBounds = {Max_Bounds}
                          maxBoundsViscosity = {1.0}
                          minZoom = {Max_Zoom}>

                <TileLayer 
                    attribution= '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url = 'https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png'
                />


            </MapContainer>
        </>

    );
}

export default Map_Page;