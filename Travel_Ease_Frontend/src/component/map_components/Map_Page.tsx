import React from "react";
import "leaflet/dist/leaflet.css";
import { MapContainer, TileLayer, Marker, ZoomControl, useMapEvents } from "react-leaflet";
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

export default function Map_Page({
  search_result,
  start,
  end,
  onMapClear,
}: MapPageProps): React.ReactElement {
  const Tagaytay_Center: LatLngExpression = [14.1154, 120.962];
  const zoom = 14;
  const Max_Zoom = 13;
  const Max_Bounds: LatLngBoundsExpression = [
    [14.05217, 120.876775],
    [14.18201, 121.048989],
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
      minZoom={Max_Zoom}
      zoomControl={false}
      className="w-full h-screen"
    >
      <TileLayer
        attribution="&copy; OpenStreetMap contributors"
        url="https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png"
      />

      <ZoomControl position="bottomright" />

      {position && <Marker position={position} icon={custom_icon} />}

      {position && <Map_Mover position={position} />}

      {start && end && <Routing_Machine start={start} end={end} />}
    </MapContainer>
  );
}

