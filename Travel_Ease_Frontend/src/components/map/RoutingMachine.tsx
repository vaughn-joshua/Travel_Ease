import { useEffect, useRef } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet-routing-machine";
import "leaflet-routing-machine/dist/leaflet-routing-machine.css";

// Custom ORS router for leaflet-routing-machine
// Replaces the OSRM demo server (which has sparse Philippines road data)
// with OpenRouteService which has accurate, up-to-date Philippines coverage.
function createORSRouter(apiKey: string) {
  return {
    route(waypoints: any[], callback: Function, context: any) {
      if (!apiKey) {
        callback.call(context, { status: -1, message: 'VITE_ORS_API_KEY not set in .env.local' });
        return;
      }
      const coordinates = waypoints.map((wp: any) => [wp.latLng.lng, wp.latLng.lat]);
      fetch('https://api.openrouteservice.org/v2/directions/driving-car/geojson', {
        method: 'POST',
        headers: {
          Authorization: apiKey,
          'Content-Type': 'application/json',
          Accept: 'application/json, application/geo+json',
        },
        body: JSON.stringify({ coordinates }),
      })
        .then(r => r.json())
        .then(data => {
          if (!data.features?.[0]) {
            callback.call(context, { status: -1, message: 'ORS: no route found' });
            return;
          }
          const feature = data.features[0];
          const { summary, segments } = feature.properties;
          const coords = (feature.geometry.coordinates as [number, number][]).map(
            ([lng, lat]) => L.latLng(lat, lng)
          );
          const steps = segments?.[0]?.steps ?? [];
          const instructions = steps.map((step: any) => ({
            type: step.type,
            road: step.name ?? '',
            distance: step.distance,
            time: step.duration,
            index: step.way_points?.[0] ?? 0,
            mode: 'driving',
          }));
          callback.call(context, null, [{
            name: 'Route',
            summary: { totalDistance: summary.distance, totalTime: summary.duration },
            coordinates: coords,
            instructions,
            inputWaypoints: waypoints,
            waypoints,
            properties: { isSimplified: false },
          }]);
        })
        .catch(err => callback.call(context, { status: -1, message: String(err) }));
    },
    buildRouteUrl() { return ''; },
  };
}

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
      // Use ORS when key is set (accurate Philippines data), otherwise fall back to OSRM demo
      const orsApiKey = import.meta.env.VITE_ORS_API_KEY ?? '';
      const routerOption = orsApiKey
        ? { router: createORSRouter(orsApiKey) }
        : {};

      // Create routing control — uses ORS router for accurate Philippines road data
      const routingControl = L.Routing.control({
        waypoints: [L.latLng(startLat, startLng), L.latLng(endLat, endLng)],
        ...routerOption,
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
