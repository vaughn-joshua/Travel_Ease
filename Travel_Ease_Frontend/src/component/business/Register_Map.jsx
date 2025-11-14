import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix default Leaflet icons (very important)
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

const defaultIcon = L.icon({
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

L.Marker.prototype.options.icon = defaultIcon;

// ------------------------
const Tagaytay_Center = [14.1154, 120.962];
const zoom = 13;

function Register_Map({ pins }) {
  return (
    <MapContainer
      center={Tagaytay_Center}
      zoom={zoom}
      style={{ height: "100%", width: "100%" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {/* Loop through pins and display markers */}
      {pins &&
        pins.map((pin, index) => (
          <Marker key={index} position={[pin.lat, pin.lng]}>
            <Popup>
              📍 <b>Pin {index + 1}</b>
              <br />
              Lat: {pin.lat}
              <br />
              Lng: {pin.lng}
            </Popup>
          </Marker>
        ))}
    </MapContainer>
  );
}

export default Register_Map;
