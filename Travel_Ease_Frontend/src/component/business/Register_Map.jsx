import { MapContainer, TileLayer } from "react-leaflet";
import "leaflet/dist/leaflet.css";

const Tagaytay_Center = [14.1154, 120.962];
const zoom = 13;

function Register_Map() {
  return (
    <>
      <MapContainer
        center={Tagaytay_Center}
        zoom={zoom}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* search for a location */}
        {/* check pin */}
        {/* save lat long */}
      </MapContainer>
    </>
  );
}

export default Register_Map;
