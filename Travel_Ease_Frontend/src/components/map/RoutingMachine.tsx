import { useEffect, useRef } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet-routing-machine";

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

    const routingControl = L.Routing.control({
      waypoints: [L.latLng(start[0], start[1]), L.latLng(end[0], end[1])],
      lineOptions: {
        styles: [{ color: "#E10600", weight: 4 }],
        extendToWaypoints: false,
        missingRouteTolerance: 0,
      },
      show: true,
      addWaypoints: false,
      routeWhileDragging: false,
      fitSelectedRoutes: true,
      showAlternatives: false,
    } as L.Routing.RoutingControlOptions).addTo(map);

    // Listen for route found event
    routingControl.on("routesfound", (e: RoutingEvent) => {
      const routes = e.routes;
      if (routes && routes.length > 0) {
        const route = routes[0];
        const distanceKm = route.summary.totalDistance / 1000; // Convert meters to km
        const timeMin = route.summary.totalTime / 60; // Convert seconds to minutes
        onRouteFoundRef.current?.({
          distance: Math.round(distanceKm * 10) / 10, // Round to 1 decimal
          time: Math.round(timeMin),
        });
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
  }, [map, start, end]);

  return null;
}

