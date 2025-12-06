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

import { MapContainer, Marker, TileLayer, ZoomControl, Popup } from "react-leaflet";
import { Icon, LatLngBoundsExpression, LatLngExpression } from "leaflet";

import "leaflet-routing-machine";
import "leaflet-routing-machine/dist/leaflet-routing-machine.css";

import RoutingMachine, { type RouteInfo } from "../components/map/RoutingMachine";

export interface MapMarker {
  position: [number, number];
  type: 'activity' | 'priority' | 'accommodation';
  name?: string;
}

interface LandingPageProps {
  className?: string;
  start?: [number, number] | null;
  end?: [number, number] | null;
  markers?: MapMarker[];
  onRouteFound?: (routeInfo: RouteInfo) => void;
}

export default function LandingPage({
  className,
  start,
  end,
  markers = [],
  onRouteFound,
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

  // Priority activity icon (star) - using SVG data URL
  const priority_icon = new Icon({
    iconUrl: 'data:image/svg+xml;base64,' + btoa(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="gold" stroke="orange" stroke-width="2">
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
      </svg>
    `),
    iconSize: [30, 30],
    iconAnchor: [15, 30],
    popupAnchor: [0, -30],
  });

  // Accommodation icon (bed) - using SVG data URL
  const accommodation_icon = new Icon({
    iconUrl: 'data:image/svg+xml;base64,' + btoa(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="blue" stroke="darkblue" stroke-width="2">
        <path d="M2 7h20v2H2zm0 4h20v2H2zm0 4h20v2H2z"/>
        <rect x="2" y="5" width="8" height="12" fill="none" stroke="darkblue" stroke-width="2"/>
        <rect x="14" y="5" width="8" height="12" fill="none" stroke="darkblue" stroke-width="2"/>
      </svg>
    `),
    iconSize: [30, 30],
    iconAnchor: [15, 30],
    popupAnchor: [0, -30],
  });

  // Get icon based on marker type
  const getMarkerIcon = (type: MapMarker['type']): Icon => {
    switch (type) {
      case 'priority':
        return priority_icon;
      case 'accommodation':
        return accommodation_icon;
      case 'activity':
      default:
        return custom_icon;
    }
  };

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

        {/* Render all markers from markers array */}
        {markers.map((marker, index) => (
          <Marker
            key={`marker-${index}-${marker.position[0]}-${marker.position[1]}`}
            position={marker.position as LatLngExpression}
            icon={getMarkerIcon(marker.type)}
          >
            {marker.name && (
              <Popup>
                <div className="text-sm font-medium">{marker.name}</div>
              </Popup>
            )}
          </Marker>
        ))}

        <RoutingMachine start={start} end={end} onRouteFound={onRouteFound} />
      </MapContainer>
    </div>
  );
}

