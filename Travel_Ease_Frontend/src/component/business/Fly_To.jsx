import { useMap } from "react-leaflet";
import { useEffect } from "react";

export default function MapFlyTo({ center }) {
  const map = useMap();

  useEffect(() => {
    if (!center) return;
    map.flyTo(center, map.getZoom());
  }, [center]);

  return null;
}
