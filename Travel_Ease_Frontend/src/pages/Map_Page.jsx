import { useLoadScript } from "@react-google-maps/api";
import Map from "../components/Map.jsx";

function Map_Page() {
  const { isLoaded } = useLoadScript({
    googleMapsApiKey: import.meta.env.VITE_Google_Maps_API_Key,
    libraries: ["places"],
  });

  if (!isLoaded) return <div>Loading...</div>;

  return (
    <>
      <h1>Maps here</h1>
      <Map />
    </>
  );
}

export default Map_Page;
