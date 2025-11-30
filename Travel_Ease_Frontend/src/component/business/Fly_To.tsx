import { useEffect } from "react";
import { useMap } from "react-leaflet";
import { LatLngExpression } from "leaflet";

interface FlyToProps {
  position: LatLngExpression;
  zoom?: number;
}

export default function Fly_To({ position, zoom = 16 }: FlyToProps): null {
  const map = useMap();

  useEffect(() => {
    if (position) {
      map.flyTo(position, zoom);
    }
  }, [map, position, zoom]);

  return null;
}

