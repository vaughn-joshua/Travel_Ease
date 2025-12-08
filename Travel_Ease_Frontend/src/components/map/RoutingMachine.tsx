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
    console.log("[RoutingMachine] ========== ROUTING MACHINE EFFECT ==========");
    console.log("[RoutingMachine] start:", start);
    console.log("[RoutingMachine] end:", end);
    console.log("[RoutingMachine] start type:", typeof start, Array.isArray(start));
    console.log("[RoutingMachine] end type:", typeof end, Array.isArray(end));
    
    if (!start || !end) {
      console.log("[RoutingMachine] ❌ No start or end point, clearing route");
      console.log("[RoutingMachine] start is null/undefined:", !start);
      console.log("[RoutingMachine] end is null/undefined:", !end);
      // Clear route info when no route
      onRouteFoundRef.current?.({ distance: 0, time: 0 });
      return;
    }

    // Validate coordinates
    if (!Array.isArray(start) || start.length !== 2 || !Array.isArray(end) || end.length !== 2) {
      console.error("[RoutingMachine] ❌ Invalid coordinate format");
      console.error("[RoutingMachine] start format:", start, "is array:", Array.isArray(start));
      console.error("[RoutingMachine] end format:", end, "is array:", Array.isArray(end));
      return;
    }

    const [startLat, startLng] = start;
    const [endLat, endLng] = end;

    if (typeof startLat !== 'number' || typeof startLng !== 'number' || 
        typeof endLat !== 'number' || typeof endLng !== 'number') {
      console.error("[RoutingMachine] ❌ Invalid coordinate types");
      console.error("[RoutingMachine] startLat:", startLat, "type:", typeof startLat);
      console.error("[RoutingMachine] startLng:", startLng, "type:", typeof startLng);
      console.error("[RoutingMachine] endLat:", endLat, "type:", typeof endLat);
      console.error("[RoutingMachine] endLng:", endLng, "type:", typeof endLng);
      return;
    }

    if (isNaN(startLat) || isNaN(startLng) || isNaN(endLat) || isNaN(endLng)) {
      console.error("[RoutingMachine] ❌ Coordinates contain NaN");
      return;
    }

    console.log("[RoutingMachine] ✅ Both start and end points available");
    console.log("[RoutingMachine] Creating routing control with waypoints:", {
      start: [startLat, startLng],
      end: [endLat, endLng],
    });

    try {
      // Create routing control - use default router (works in LandingPage/Planner)
      const routingControl = L.Routing.control({
        waypoints: [L.latLng(startLat, startLng), L.latLng(endLat, endLng)],
        lineOptions: {
          styles: [{ color: "#E10600", weight: 5, opacity: 0.8 }],
          extendToWaypoints: true,
          missingRouteTolerance: 0,
        },
        show: false, // Hide the control panel
        addWaypoints: false,
        routeWhileDragging: false,
        fitSelectedRoutes: true,
        showAlternatives: false,
        createMarker: () => null, // Don't create default markers (we use our own)
      } as any).addTo(map);

      console.log("[RoutingMachine] ✅ Routing control created and added to map, waiting for route calculation...");

      // Listen for route found event
      (routingControl as any).on("routesfound", (e: RoutingEvent) => {
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
      (routingControl as any).on("routingerror", (e: any) => {
        console.error("[RoutingMachine] ========== ROUTING ERROR ==========");
        console.error("[RoutingMachine] Routing error:", e);
        console.error("[RoutingMachine] Error details:", JSON.stringify(e, null, 2));
      });

      // Hide the routing control panel
      const container = routingControl.getContainer();
      if (container) {
        container.style.display = "none";
      }

      return () => {
        map.removeControl(routingControl);
      };
    } catch (error) {
      console.error("[RoutingMachine] ========== ROUTING CONTROL CREATION ERROR ==========");
      console.error("[RoutingMachine] Failed to create routing control:", error);
      console.error("[RoutingMachine] Error details:", error instanceof Error ? error.message : String(error));
      // Return empty cleanup function if routing control creation failed
      return () => {
        // No cleanup needed if routing control was never created
      };
    }
  }, [map, start, end]);

  return null;
}

