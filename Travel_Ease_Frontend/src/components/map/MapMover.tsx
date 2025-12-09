import { useEffect } from "react";
import { useMap } from "react-leaflet";
import { LatLngExpression } from "leaflet";

interface MapMoverProps {
  position: LatLngExpression | null;
}

export function MapMover({ position }: MapMoverProps): null {
  const map = useMap();

  useEffect(() => {
    if (position && Array.isArray(position) && position.length === 2) {
      map.flyTo(position, 16);
    }
  }, [map, position]);

  return null;
}

export default MapMover;
