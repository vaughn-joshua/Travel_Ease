// RoutingMachine.jsx

import { useEffect, useRef } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet-routing-machine";
import "leaflet-routing-machine/dist/leaflet-routing-machine.css";

// We're not rendering a React component, just interfacing with the map
const Routing_Machine = ({ start, end }) => {
  const map = useMap(); // Get the map instance from the parent MapContainer
  const routingControlRef = useRef(null);

  useEffect(() => {
    // Check if the map instance is ready
    if (!map) return;

    // Remove previous route if it exists
    if (routingControlRef.current) {
      map.removeControl(routingControlRef.current);
      routingControlRef.current = null;
    }

    // Only add a new route when both start and end exist
    if (start && end) {
      routingControlRef.current = L.Routing.control({
        waypoints: [
          L.latLng(start[0], start[1]),
          L.latLng(end[0], end[1]),
        ],
        routeWhileDragging: false,
        addWaypoints: false,
        draggableWaypoints: false,
        show: false, // Hides the turn-by-turn instructions panel
        lineOptions: {
          styles: [{ color: "blue", weight: 5, opacity: 0.7 }],
        },
        // This hides the default 'A' and 'B' markers
        createMarker: () => null, 
      }).addTo(map);
    }
  }, [map, start, end]); // Effect dependencies

  return null; // This component doesn't render any visible JSX
};

export default Routing_Machine;