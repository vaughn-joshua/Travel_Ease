/**
 * Landing_Page Component
 *
 * This component renders an interactive Leaflet map focused on Tagaytay.
 * It accepts `start` and `end` coordinates to:
 *    - Display markers (start = person icon, end = location icon)
 *    - Draw a route between the two points using a custom Routing_Machine component
 */

import React, { useEffect } from "react";
import Pin_Icon from "../assets/pin.png";
import Man from "../assets/man.png";
import "leaflet/dist/leaflet.css";

import { MapContainer, Marker, TileLayer, ZoomControl, Popup, useMap } from "react-leaflet";
import { Icon, LatLngBoundsExpression, LatLngExpression } from "leaflet";

import "leaflet-routing-machine";
import "leaflet-routing-machine/dist/leaflet-routing-machine.css";

import RoutingMachine, { type RouteInfo } from "../components/map/RoutingMachine";

export interface MapMarker {
  position: [number, number];
  type: 'activity' | 'priority' | 'accommodation';
  name?: string;
  id?: string;
  description?: string;
}

interface LandingPageProps {
  className?: string;
  start?: [number, number] | null;
  end?: [number, number] | null;
  markers?: MapMarker[];
  onRouteFound?: (routeInfo: RouteInfo) => void;
  focusPosition?: [number, number] | null;
}

function MapFocus({ position }: { position: LatLngExpression | null }) {
  const map = useMap();

  useEffect(() => {
    if (!position) return;

    const targetZoom = Math.max(map.getZoom(), 15);
    map.flyTo(position, targetZoom, { duration: 0.6 });
  }, [map, position]);

  return null;
}

export default function LandingPage({
  className,
  start,
  end,
  markers = [],
  onRouteFound,
  focusPosition,
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
    iconSize: [36, 36],
    iconAnchor: [18, 36],
    popupAnchor: [0, -20],
  });

  const custom_icon_person = new Icon({
    iconUrl: Man,
    iconSize: [38, 38],
    iconAnchor: [19, 38],
    popupAnchor: [0, -20],
  });

  // Priority activity icon (star) - using SVG data URL
  const priority_icon = new Icon({
    iconUrl: 'data:image/svg+xml;base64,' + btoa(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="gold" stroke="orange" stroke-width="2">
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
      </svg>
    `),
    iconSize: [34, 34],
    iconAnchor: [17, 34],
    popupAnchor: [0, -26],
  });

  // Accommodation icon (bed) - using SVG data URL
  const accommodation_icon = new Icon({
    iconUrl:
      "data:image/svg+xml;base64," +
      btoa(`
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#fb923c" stroke="#ea580c" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M3 10.5L12 4l9 6.5v8.5a1.5 1.5 0 0 1-1.5 1.5h-4.5v-5a1.5 1.5 0 0 0-1.5-1.5h-3A1.5 1.5 0 0 0 9 15.5v5H4.5A1.5 1.5 0 0 1 3 19.5Z" />
          <path d="M9 21.5V17a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v4.5" />
        </svg>
      `),
    iconSize: [36, 36],
    iconAnchor: [18, 36],
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

        <MapFocus position={focusPosition ?? null} />

        <ZoomControl position="bottomright" />

        {start && (
          <Marker position={start as LatLngExpression} icon={custom_icon_person} />
        )}

        {end && <Marker position={end as LatLngExpression} icon={custom_icon} />}

        {/* Render all markers from markers array */}
        {markers.map((marker, index) => (
          <Marker
            key={marker.id ?? `marker-${index}-${marker.position[0]}-${marker.position[1]}`}
            position={marker.position as LatLngExpression}
            icon={getMarkerIcon(marker.type)}
            riseOnHover
          >
            {marker.name && (
              <Popup>
                <div className="text-sm font-medium">
                  {marker.name}
                  {marker.description && (
                    <p className="mt-1 text-xs text-gray-500">{marker.description}</p>
                  )}
                </div>
              </Popup>
            )}
          </Marker>
        ))}

        <RoutingMachine start={start} end={end} onRouteFound={onRouteFound} />
      </MapContainer>
    </div>
  );
}

