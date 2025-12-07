import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L, { LatLngExpression, LeafletEvent } from "leaflet";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
import { useEffect, useState } from "react";
import MapFlyTo from "./FlyTo";

const defaultIcon = L.icon({
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});
L.Marker.prototype.options.icon = defaultIcon;

const Tagaytay_Center: LatLngExpression = [14.1154, 120.962];
const zoom = 13;

interface Pin {
  lat: number;
  lon: number;
}

interface RegisterMapProps {
  pins: Pin[];
  onPinMove: (lat: number, lng: number) => void;
  allowClickToPlace?: boolean;
}

/**
 * MapClickHandler - Handles click events to place a pin when no pin exists
 */
function MapClickHandler({ 
  onPinPlace, 
  enabled 
}: { 
  onPinPlace: (lat: number, lng: number) => void; 
  enabled: boolean;
}) {
  useMapEvents({
    click: (e) => {
      if (enabled) {
        onPinPlace(e.latlng.lat, e.latlng.lng);
      }
    },
  });
  return null;
}

function RegisterMap({ pins, onPinMove, allowClickToPlace = true }: RegisterMapProps) {
  const [center, setCenter] = useState<LatLngExpression>(Tagaytay_Center);
  const firstPin = pins?.[0];

  useEffect(() => {
    if (!firstPin) return;
    setCenter([Number(firstPin.lat), Number(firstPin.lon)]);
  }, [pins, firstPin]);

  return (
    <MapContainer
      center={center}
      zoom={zoom}
      style={{ height: "100%", width: "100%" }}
    >
      <TileLayer
        attribution="&copy; OpenStreetMap contributors"
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <MapFlyTo center={center} />
      
      {/* Allow clicking to place pin when no pin exists */}
      <MapClickHandler 
        onPinPlace={onPinMove} 
        enabled={allowClickToPlace && !firstPin} 
      />

      {firstPin && (
        <Marker
          position={[Number(firstPin.lat), Number(firstPin.lon)]}
          draggable={true}
          eventHandlers={{
            dragend: (e: LeafletEvent) => {
              const marker = e.target as L.Marker;
              const { lat, lng } = marker.getLatLng();
              onPinMove(lat, lng);
            },
          }}
        >
          <Popup>
            📍 <b>Your Business Location</b>
            <br />
            Drag to adjust the location.
          </Popup>
        </Marker>
      )}
    </MapContainer>
  );
}

export default RegisterMap;
