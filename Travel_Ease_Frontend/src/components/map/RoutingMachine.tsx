import { useEffect, useRef } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet-routing-machine";
import "leaflet-routing-machine/dist/leaflet-routing-machine.css";

export interface RouteInfo {
  distance: number; // in kilometers
  time: number; // in minutes
}

interface RoutingMachineProps {
  start?: [number, number] | null;
  end?: [number, number] | null;
  onRouteFound?: (routeInfo: RouteInfo) => void;
}

// Type for the routing event (leaflet-routing-machine doesn't export proper types)
interface RoutingEvent {
  routes: Array<{
    summary: {
      totalDistance: number;
      totalTime: number;
    };
  }>;
}

export default function RoutingMachine({
  start,
  end,
  onRouteFound,
}: RoutingMachineProps): null {
  const map = useMap();
  const onRouteFoundRef = useRef(onRouteFound);
  
  // Keep ref updated with latest callback
  useEffect(() => {
    onRouteFoundRef.current = onRouteFound;
  }, [onRouteFound]);

  useEffect(() => {
    if (!start || !end) {
      // Clear route info when no route
      onRouteFoundRef.current?.({ distance: 0, time: 0 });
      return;
    }

    // Validate coordinates
    if (!Array.isArray(start) || start.length !== 2 || !Array.isArray(end) || end.length !== 2) {
      return;
    }

    const [startLat, startLng] = start;
    const [endLat, endLng] = end;

    if (typeof startLat !== 'number' || typeof startLng !== 'number' || 
        typeof endLat !== 'number' || typeof endLng !== 'number') {
      return;
    }

    if (isNaN(startLat) || isNaN(startLng) || isNaN(endLat) || isNaN(endLng)) {
      return;
    }

    try {
      // Create routing control
      const routingControl = L.Routing.control({
        waypoints: [L.latLng(startLat, startLng), L.latLng(endLat, endLng)],
        lineOptions: {
          styles: [{ color: "#E10600", weight: 5, opacity: 0.8 }],
          extendToWaypoints: true,
          missingRouteTolerance: 0,
        },
        show: false,
        addWaypoints: false,
        routeWhileDragging: false,
        fitSelectedRoutes: true,
        showAlternatives: false,
        createMarker: () => null,
      } as any).addTo(map);

      // Listen for route found event
      (routingControl as any).on("routesfound", (e: RoutingEvent) => {
        const routes = e.routes;
        if (routes && routes.length > 0) {
          const route = routes[0];
          const distanceKm = route.summary.totalDistance / 1000;
          const timeMin = route.summary.totalTime / 60;
          const routeInfo = {
            distance: Math.round(distanceKm * 10) / 10,
            time: Math.round(timeMin),
          };
          onRouteFoundRef.current?.(routeInfo);
        }
      });

      // Hide the routing control panel
      const container = routingControl.getContainer();
      if (container) {
        container.style.display = "none";
      }

      return () => {
        map.removeControl(routingControl);
      };
    } catch {
      return () => {};
    }
  }, [map, start, end]);

  return null;
}
