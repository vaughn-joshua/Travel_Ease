import {
  GoogleMap,
  Marker,
  DirectionsService,
  DirectionsRenderer,
} from "@react-google-maps/api";
import { useEffect, useMemo, useState } from "react";

const TAGAYTAY_COORDINATES = { lat: 14.117, lng: 120.949 };

function Map_Routes({ container_name, stops_json }) {
  const center = useMemo(() => TAGAYTAY_COORDINATES, []);
  // const options = useMemo(() => ({}), []);
  const [infoPos, setInfoPos] = useState(null);

  const [routes, setRoutes] = useState(null);
  const [directions, setDirections] = useState(null);

  // useEffect(() => {
  //   console.log(directions);
  // }, [directions]);

  return (
    <div className="container">
      <div className="map_controls">
        <h1>map routes</h1>
        {routes &&
          routes.legs.map((leg, i) => (
            <div key={i}>
              <p className="destinations">
                From: {leg.start_address} <br />
                To: {leg.end_address}
                <br />
                ETA: {leg.duration.text} <br />
                Distance: {leg.distance.text}
              </p>
            </div>
          ))}
      </div>
      <div className="map">
        <GoogleMap
          zoom={12}
          center={center}
          mapContainerClassName={container_name}
          // options={options}
        >
          {/* Request directions */}
          <DirectionsService
            options={{
              origin: center,
              destination: stops_json.destination,
              waypoints: stops_json.waypoints,
              // optimizeWaypoints: true,
              travelMode: stops_json.travelMode,
            }}
            callback={(res, status) => {
              if (status === "OK") {
                setDirections(res);
                setRoutes(res.routes[0]);
                // console.log(res.routes[0]); // log the route
              } else {
                console.error("Directions request failed due to ", status);
              }
            }}
          />

          {/* Render directions */}
          {directions && (
            <DirectionsRenderer
              directions={directions}
              options={{
                suppressMarkers: false,
                suppressInfoWindows: false, // disable default dialogs
              }}
              onLoad={(renderer) => {
                // Add a click listener to the route
                google.maps.event.addListener(renderer, "click", (e) => {
                  console.log("Clicked route at:", e.latLng.toString());
                  setInfoPos(e.latLng); // save click position
                });
              }}
            />
          )}
          {infoPos && (
            <InfoWindow
              position={infoPos}
              onCloseClick={() => setInfoPos(null)}
            >
              <div>
                <h4>Route Info</h4>
                <p>You clicked on this route segment!</p>
              </div>
            </InfoWindow>
          )}
        </GoogleMap>
      </div>
    </div>
  );
}

export default Map_Routes;
