import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
import { useEffect, useState } from "react";
import MapFlyTo from "./Fly_To.jsx";

const defaultIcon = L.icon({
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});
L.Marker.prototype.options.icon = defaultIcon;

const Tagaytay_Center = [14.1154, 120.962];
const zoom = 13;

function Register_Map({ pins, onPinMove }) {
  const [center, setCenter] = useState(Tagaytay_Center);
  const firstPin = pins?.[0];

  useEffect(() => {
    if (!firstPin) return;
    setCenter([Number(firstPin.lat), Number(firstPin.lon)]);
  }, [pins]);

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

      {firstPin && (
        <Marker
          position={[Number(firstPin.lat), Number(firstPin.lon)]}
          draggable={true}
          eventHandlers={{
            dragend: (e) => {
              const { lat, lng } = e.target.getLatLng();
              onPinMove(lat, lng); // send updated coordinates to parent
            },
          }}
        >
          <Popup>
            📍 <b>Adjustable Pin</b>
            <br />
            Drag to adjust the location.
          </Popup>
        </Marker>
      )}
    </MapContainer>
  );
}

export default Register_Map;
