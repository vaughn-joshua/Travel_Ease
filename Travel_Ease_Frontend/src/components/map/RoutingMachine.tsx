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
    console.log("[RoutingMachine] ========== ROUTING MACHINE EFFECT ==========");
    console.log("[RoutingMachine] start:", start);
    console.log("[RoutingMachine] end:", end);
    
    if (!start || !end) {
      console.log("[RoutingMachine] ❌ No start or end point, clearing route");
      // Clear route info when no route
      onRouteFoundRef.current?.({ distance: 0, time: 0 });
      return;
    }

    console.log("[RoutingMachine] ✅ Both start and end points available");
    console.log("[RoutingMachine] Creating routing control with waypoints:", {
      start: [start[0], start[1]],
      end: [end[0], end[1]],
    });

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

    console.log("[RoutingMachine] ✅ Routing control added to map, waiting for route calculation...");

    // Listen for route found event
    routingControl.on("routesfound", (e: RoutingEvent) => {
      console.log("[RoutingMachine] ========== ROUTE FOUND EVENT ==========");
      console.log("[RoutingMachine] Routes event:", e);
      const routes = e.routes;
      console.log("[RoutingMachine] Number of routes found:", routes?.length || 0);
      
      if (routes && routes.length > 0) {
        const route = routes[0];
        console.log("[RoutingMachine] First route summary:", route.summary);
        const distanceKm = route.summary.totalDistance / 1000; // Convert meters to km
        const timeMin = route.summary.totalTime / 60; // Convert seconds to minutes
        const routeInfo = {
          distance: Math.round(distanceKm * 10) / 10, // Round to 1 decimal
          time: Math.round(timeMin),
        };
        console.log("[RoutingMachine] ✅ Calculated route info:", routeInfo);
        onRouteFoundRef.current?.(routeInfo);
      } else {
        console.warn("[RoutingMachine] ⚠️ No routes found in event");
      }
    });

    // Listen for errors
    routingControl.on("routingerror", (e: any) => {
      console.error("[RoutingMachine] ========== ROUTING ERROR ==========");
      console.error("[RoutingMachine] Routing error:", e);
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

