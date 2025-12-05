/**
 * Landing_Page Component
 *
 * This component renders an interactive Leaflet map focused on Tagaytay.
 * It accepts `start` and `end` coordinates to:
 *    - Display markers (start = person icon, end = location icon)
 *    - Draw a route between the two points using a custom Routing_Machine component
 */

import React from "react";
import Pin_Icon from "../assets/pin.png";
import Man from "../assets/man.png";
import "leaflet/dist/leaflet.css";

import { MapContainer, Marker, TileLayer, ZoomControl } from "react-leaflet";
import { Icon, LatLngBoundsExpression, LatLngExpression } from "leaflet";

import "leaflet-routing-machine";
import "leaflet-routing-machine/dist/leaflet-routing-machine.css";

import RoutingMachine from "../components/map/RoutingMachine";

interface LandingPageProps {
  className?: string;
  start?: [number, number] | null;
  end?: [number, number] | null;
}

export default function LandingPage({
  className,
  start,
  end,
}: LandingPageProps): React.ReactElement {
  // Default map center (Tagaytay)
  const Tagaytay_Center: LatLngExpression = [14.1154, 120.962];

  // Map zoom configuration
  const zoom = 14;
  const Max_Zoom = 13;

  // Restricts the map area users can pan to (bounding box around Tagaytay)
  const Max_Bounds: LatLngBoundsExpression = [
    [14.05217, 120.876775],
    [14.18201, 121.048989],
  ];

  // Custom icons for markers
  const custom_icon = new Icon({
    iconUrl: Pin_Icon,
    iconSize: [30, 30],
  });

  const custom_icon_person = new Icon({
    iconUrl: Man,
    iconSize: [30, 30],
  });

  return (
    <div className={`${className} [&_.leaflet-pane]:z-[1] [&_.leaflet-control]:z-[1]`}>
      <MapContainer
        center={Tagaytay_Center}
        zoom={zoom}
        maxBounds={Max_Bounds}
        maxBoundsViscosity={1.0}
        minZoom={Max_Zoom}
        zoomControl={false}
        className="w-full h-full"
      >
        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png"
        />

        <ZoomControl position="bottomright" />

        {start && (
          <Marker position={start as LatLngExpression} icon={custom_icon_person} />
        )}

        {end && <Marker position={end as LatLngExpression} icon={custom_icon} />}

        <RoutingMachine start={start} end={end} />
      </MapContainer>
    </div>
  );
}

