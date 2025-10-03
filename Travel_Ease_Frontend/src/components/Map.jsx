import { GoogleMap, Marker } from "@react-google-maps/api";
import { useMemo } from "react";
import Map_Routes from "./Map_Routes";

const TAGAYTAY_COORDINATES = { lat: 14.117, lng: 120.949 };

const stops_json = {
  origin: { lat: 14.1122, lng: 120.9331 },
  destination: { lat: 14.1233, lng: 121.0023 },
  waypoints: [
    { location: { lat: 14.1181, lng: 120.9363 }, stopover: true },
    { location: { lat: 14.1173, lng: 120.9302 }, stopover: true },
    { location: { lat: 14.1347, lng: 121.0222 }, stopover: true },
  ],
  travelMode: "DRIVING",
};

function Map() {
  const center = useMemo(() => TAGAYTAY_COORDINATES, []);
  const options = useMemo(() => ({}), []);

  return (
    <>
      <h1>maps</h1>
      <GoogleMap
        zoom={12}
        center={center}
        mapContainerClassName="map-container"
        options={options}
      >
        <Marker position={center} />
        <Map_Routes stops_json={stops_json} />
      </GoogleMap>
    </>
  );
}

export default Map;
