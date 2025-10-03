import {
  GoogleMap,
  Marker,
  DirectionsService,
  DirectionsRenderer,
} from "@react-google-maps/api";
import { useMemo, useState } from "react";

const TAGAYTAY_COORDINATES = { lat: 14.117, lng: 120.949 };

function Map_Routes({ stops_json }) {
  const center = useMemo(() => TAGAYTAY_COORDINATES, []);
  // const options = useMemo(() => ({}), []);
  const [directions, setDirections] = useState(null);

  return (
    <>
      <h1>maps</h1>
      <GoogleMap
        zoom={12}
        center={center}
        mapContainerClassName="map-container"
        // options={options}
      >
        {/* Request directions */}
        <DirectionsService
          options={{
            origin: center,
            destination: stops_json.destination,
            waypoints: stops_json.waypoints,
            optimizeWaypoints: true,
            travelMode: stops_json.travelMode,
          }}
          callback={(res, status) => {
            if (status === "OK") {
              setDirections(res);
              // console.log(res.routes[0]); // log the route
            } else {
              console.error("Directions request failed due to ", status);
            }
          }}
        />

        {/* Render directions */}
        {directions && <DirectionsRenderer directions={directions} />}

        <Marker position={center} />
      </GoogleMap>
    </>
  );
}

export default Map_Routes;
