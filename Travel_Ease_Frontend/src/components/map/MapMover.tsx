import { useEffect } from "react";
import { useMap } from "react-leaflet";
import { LatLngExpression } from "leaflet";

interface MapMoverProps {
  position: LatLngExpression | null;
}

export function MapMover({ position }: MapMoverProps): null {
  const map = useMap();

  useEffect(() => {
    console.log("[MapMover] ========== MAP MOVER EFFECT ==========");
    console.log("[MapMover] position:", position);
    console.log("[MapMover] position type:", typeof position, Array.isArray(position));
    
    if (position) {
      if (Array.isArray(position) && position.length === 2) {
        const [lat, lng] = position;
        console.log("[MapMover] ✅ Moving map to position:", { lat, lng });
        console.log("[MapMover] Calling map.flyTo with zoom 16");
        map.flyTo(position, 16);
        console.log("[MapMover] ✅ Map flyTo completed");
      } else {
        console.warn("[MapMover] ⚠️ Invalid position format:", position);
      }
    } else {
      console.log("[MapMover] ⏳ No position provided, map will not move");
    }
  }, [map, position]);

  return null;
}

export default MapMover;

