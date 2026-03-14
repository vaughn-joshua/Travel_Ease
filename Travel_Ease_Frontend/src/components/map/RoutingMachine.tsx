import { useEffect, useRef } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet-routing-machine";
import "leaflet-routing-machine/dist/leaflet-routing-machine.css";
import type { TransportProfile } from "../../types/map";

function createORSRouter(apiKey: string, profile: TransportProfile) {
  return {
    route(waypoints: any[], callback: Function, context: any) {
      if (!apiKey) {
        callback.call(context, { status: -1, message: 'VITE_ORS_API_KEY not set' });
        return;
      }
      const coordinates = waypoints.map((wp: any) => [wp.latLng.lng, wp.latLng.lat]);
      fetch(`https://api.openrouteservice.org/v2/directions/${profile}/geojson`, {
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
          if (data.error) {
            callback.call(context, { status: -1, message: data.error.message ?? 'ORS error' });
            return;
          }
          if (!data.features?.[0]) {
            callback.call(context, { status: -1, message: 'No route found' });
            return;
          }
          const feature = data.features[0];
          const { summary, segments } = feature.properties;
          const coords = (feature.geometry.coordinates as [number, number][]).map(
            ([lng, lat]) => L.latLng(lat, lng)
          );
          const allSteps = (segments ?? []).flatMap((seg: any) => seg.steps ?? []);
          const instructions = allSteps.map((step: any) => ({
            type: step.type,
            road: step.name ?? '',
            distance: step.distance,
            time: step.duration,
            index: step.way_points?.[0] ?? 0,
            mode: profile,
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
  profile?: TransportProfile;
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

const ROUTE_COLORS: Record<TransportProfile, string> = {
  "driving-car": "#E10600",
  "foot-walking": "#2563eb",
  "cycling-regular": "#16a34a",
};

export default function RoutingMachine({
  start,
  end,
  profile = "driving-car",
  onRouteFound,
}: RoutingMachineProps): null {
  const map = useMap();
  const onRouteFoundRef = useRef(onRouteFound);

  useEffect(() => {
    onRouteFoundRef.current = onRouteFound;
  }, [onRouteFound]);

  useEffect(() => {
    if (!start || !end) {
      onRouteFoundRef.current?.({ distance: 0, time: 0 });
      return;
    }

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
      const orsApiKey = import.meta.env.VITE_ORS_API_KEY ?? '';
      const routerOption = orsApiKey
        ? { router: createORSRouter(orsApiKey, profile) }
        : {};

      const routingControl = L.Routing.control({
        waypoints: [L.latLng(startLat, startLng), L.latLng(endLat, endLng)],
        ...routerOption,
        lineOptions: {
          styles: [{ color: ROUTE_COLORS[profile], weight: 5, opacity: 0.8 }],
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
  }, [map, start, end, profile]);

  return null;
}
