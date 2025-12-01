import { useMap } from "react-leaflet";
import { useEffect } from "react";
import { LatLngExpression } from "leaflet";

interface MapFlyToProps {
  center: LatLngExpression | null;
}

export default function MapFlyTo({ center }: MapFlyToProps) {
  const map = useMap();

  useEffect(() => {
    if (!center) return;
    map.flyTo(center, map.getZoom());
  }, [center, map]);

  return null;
}
