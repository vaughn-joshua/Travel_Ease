import { useLoadScript } from "@react-google-maps/api";
import Map from "../components/Map.jsx";
import Map_Routes from "../components/Map_Routes.jsx";

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

function Map_Page() {
  const { isLoaded } = useLoadScript({
    googleMapsApiKey: import.meta.env.VITE_Google_Maps_API_Key,
    libraries: ["places"],
  });

  if (!isLoaded) return <div>Loading...</div>;

  return (
    <>
      <Map />
      {/* <Map_Routes container_name="map-container" stops_json={stops_json} /> */}
    </>
  );
}

export default Map_Page;
