import { GoogleMap, Marker } from "@react-google-maps/api";
import { useMemo, useState, useRef } from "react";
import Places from "./Places.jsx";

const TAGAYTAY_COORDINATES = { lat: 14.117, lng: 120.949 };

function Map() {
  const center = useMemo(() => TAGAYTAY_COORDINATES, []);
  const map_ref = useRef();
  const options = useMemo(() => ({}), []);
  const [office, setOffice] = useState();

  return (
    <div className="container">
      <div className="map_controls">
        <h1>maps</h1>
        <Places
          setOffice={(position) => {
            setOffice(position);
            map_ref.current?.panTo(position);
          }}
        />
      </div>
      <div className="map">
        <GoogleMap
          zoom={12}
          center={center}
          mapContainerClassName="map-container"
          options={options}
        >
          <Marker position={center} />
        </GoogleMap>
      </div>
    </div>
  );
}

export default Map;
