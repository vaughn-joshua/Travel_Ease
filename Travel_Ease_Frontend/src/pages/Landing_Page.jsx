/**
 * Landing_Page Component
 *
 * This component renders an interactive Leaflet map focused on Tagaytay.
 * It accepts `start` and `end` coordinates to:
 *    - Display markers (start = person icon, end = location icon)
 *    - Draw a route between the two points using a custom Routing_Machine component
 *
 */

import React from "react";
import Pin_Icon from "../assets/pin.png";
import Man from "../assets/man.png";
import "leaflet/dist/leaflet.css";

import { MapContainer, Marker, TileLayer, ZoomControl } from "react-leaflet";
import L, { Icon } from "leaflet";

import "leaflet-routing-machine";
import "leaflet-routing-machine/dist/leaflet-routing-machine.css";

import { Map_Mover } from "../component/map_components/Map_Mover.jsx";
import Routing_Machine from "../component/map_components/Routing_Machine.jsx";

function Landing_Page({ className, start, end }) {
  // Default map center (Tagaytay)
  const Tagaytay_Center = [14.1154, 120.962];

  // Map zoom configuration
  const zoom = 14;
  const Max_Zoom = 13;

  // Restricts the map area users can pan to (bounding box around Tagaytay)
  const Max_Bounds = [
    [14.05217, 120.876775],
    [14.18201, 121.048989],
  ];

  /**
   * Custom icons for markers
   * - Person icon for starting location
   * - Pin icon for destination
   */
  const custom_icon = new Icon({
    iconUrl: Pin_Icon,
    iconSize: [30, 30],
  });

  const custom_icon_person = new Icon({
    iconUrl: Man,
    iconSize: [30, 30],
  });

  return (
    <>
      <div className={className}>
        {/* Main Leaflet Map */}
        <MapContainer
          center={Tagaytay_Center} // Default map center
          zoom={zoom} // Initial zoom level
          maxBounds={Max_Bounds} // Prevents dragging too far out
          maxBoundsViscosity={1.0} // Adds resistance when reaching bounds
          minZoom={Max_Zoom} // Prevent zooming out too far
          zoomControl={false} // Hide default zoom buttons (we add custom)
          className="w-full h-full"
        >
          {/* Map Tiles (OpenStreetMap Hot Style) */}
          <TileLayer
            attribution="&copy; OpenStreetMap contributors"
            url="https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png"
          />

          {/* Custom position of zoom buttons */}
          <ZoomControl position="bottomright" />

          {/* Starting point marker (shows only if `start` exists) */}
          {start && <Marker position={start} icon={custom_icon_person} />}

          {/* Destination marker (shows only if `end` exists) */}
          {end && <Marker position={end} icon={custom_icon} />}

          {/* Route generator — draws the path between start & end */}
          <Routing_Machine start={start} end={end} />

          {/* Optional map centering component (disabled for now)
              <Map_Mover position={search_result} /> 
          */}
        </MapContainer>
      </div>
    </>
  );
}

export default Landing_Page;
