import * as L from "leaflet";

declare module "leaflet" {
  namespace Routing {
    interface RoutingControlOptions {
      waypoints: L.LatLng[];
      lineOptions?: {
        styles?: Array<{ color?: string; weight?: number; opacity?: number }>;
        extendToWaypoints?: boolean;
        missingRouteTolerance?: number;
      };
      show?: boolean;
      addWaypoints?: boolean;
      routeWhileDragging?: boolean;
      fitSelectedRoutes?: boolean;
      showAlternatives?: boolean;
    }

    function control(options: RoutingControlOptions): L.Control & {
      getContainer(): HTMLElement | undefined;
    };
  }
}

