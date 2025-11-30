import React from "react";
import "leaflet/dist/leaflet.css";
import { MapContainer, TileLayer, Marker, ZoomControl, useMap } from "react-leaflet";
import { Icon, LatLngBoundsExpression, LatLngExpression } from "leaflet";
import Pin_Icon from "../../assets/pin.png";
import { Map_Mover } from "./Map_Mover";
import Routing_Machine from "./Routing_Machine";

interface MapPageProps {
  search_result?: [number, number] | { lat: number; lng: number } | null;
  start?: [number, number] | null;
  end?: [number, number] | null;
  onMapClear?: () => void;
}

const custom_icon = new Icon({
  iconUrl: Pin_Icon,
  iconSize: [30, 30],
});

// Component to enable scroll wheel zoom
function ScrollWheelZoom() {
  const map = useMap();
  
  React.useEffect(() => {
    // Enable scroll wheel zoom
    map.scrollWheelZoom.enable();
    
    // Disable default scroll behavior on the map container
    const container = map.getContainer();
    container.style.outline = 'none';
    
    return () => {
      map.scrollWheelZoom.disable();
    };
  }, [map]);
  
  return null;
}

export default function Map_Page({
  search_result,
  start,
  end,
  onMapClear,
}: MapPageProps): React.ReactElement {
  const Tagaytay_Center: LatLngExpression = [14.1154, 120.962];
  const zoom = 14;
  const Min_Zoom = 12;
  const Max_Zoom = 19;
  const Max_Bounds: LatLngBoundsExpression = [
    [14.0, 120.8],
    [14.25, 121.1],
  ];

  const getPosition = (): LatLngExpression | null => {
    if (!search_result) return null;
    if (Array.isArray(search_result)) return search_result;
    return [search_result.lat, search_result.lng];
  };

  const position = getPosition();

  return (
    <MapContainer
      center={Tagaytay_Center}
      zoom={zoom}
      maxBounds={Max_Bounds}
      maxBoundsViscosity={1.0}
      minZoom={Min_Zoom}
      maxZoom={Max_Zoom}
      zoomControl={false}
      scrollWheelZoom={true}
      className="w-full h-full"
      style={{ 
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
      }}
    >
      <TileLayer
        attribution="&copy; OpenStreetMap contributors"
        url="https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png"
      />

      {/* Enable scroll wheel zoom */}
      <ScrollWheelZoom />

      {/* Zoom controls at bottom right */}
      <ZoomControl position="bottomright" />

      {position && <Marker position={position} icon={custom_icon} />}

      {position && <Map_Mover position={position} />}

      {start && end && <Routing_Machine start={start} end={end} />}
    </MapContainer>
  );
}
