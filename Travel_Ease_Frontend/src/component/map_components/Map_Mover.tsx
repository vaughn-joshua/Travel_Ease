import { useEffect } from "react";
import { useMap } from "react-leaflet";
import { LatLngExpression } from "leaflet";

interface MapMoverProps {
  position: LatLngExpression | null;
}

export function Map_Mover({ position }: MapMoverProps): null {
  const map = useMap();

  useEffect(() => {
    if (position) {
      map.flyTo(position, 16);
    }
  }, [map, position]);

  return null;
}

export default Map_Mover;

