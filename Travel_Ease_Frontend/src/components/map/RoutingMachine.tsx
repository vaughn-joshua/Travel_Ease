import { useEffect } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet-routing-machine";

interface RoutingMachineProps {
  start?: [number, number] | null;
  end?: [number, number] | null;
}

export default function RoutingMachine({
  start,
  end,
}: RoutingMachineProps): null {
  const map = useMap();

  useEffect(() => {
    if (!start || !end) return;

    const routingControl = L.Routing.control({
      waypoints: [L.latLng(start[0], start[1]), L.latLng(end[0], end[1])],
      lineOptions: {
        styles: [{ color: "#E10600", weight: 4 }],
        extendToWaypoints: false,
        missingRouteTolerance: 0,
      },
      show: false,
      addWaypoints: false,
      routeWhileDragging: false,
      fitSelectedRoutes: true,
      showAlternatives: false,
    } as L.Routing.RoutingControlOptions).addTo(map);

    // Hide the routing control panel
    const container = routingControl.getContainer();
    if (container) {
      container.style.display = "none";
    }

    return () => {
      map.removeControl(routingControl);
    };
  }, [map, start, end]);

  return null;
}

