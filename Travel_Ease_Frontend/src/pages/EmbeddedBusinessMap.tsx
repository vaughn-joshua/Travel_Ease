import { useMemo, useEffect } from "react";
import "leaflet/dist/leaflet.css";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import { Icon, LatLngExpression, LatLngBounds } from "leaflet";
import { useTravelSpots } from "../features/businesses/queries";
import Pin_Icon from "../assets/pin.png";

const businessIcon = new Icon({
  iconUrl: Pin_Icon,
  iconSize: [28, 28],
});

// Default center (Tagaytay) when no businesses
const DEFAULT_CENTER: LatLngExpression = [14.1154, 120.962];
const DEFAULT_ZOOM = 13;

/**
 * Component to auto-recenter map when markers change.
 * Fits bounds to show all markers, or defaults to Tagaytay center.
 */
function AutoRecenter({ markers }: { markers: Array<{ latitude: number; longitude: number }> }) {
  const map = useMap();

  useEffect(() => {
    if (markers.length === 0) {
      // No markers - center on default location
      map.setView(DEFAULT_CENTER, DEFAULT_ZOOM);
      return;
    }

    if (markers.length === 1) {
      // Single marker - center on it
      map.setView([markers[0].latitude, markers[0].longitude], DEFAULT_ZOOM);
      return;
    }

    // Multiple markers - fit bounds to show all
    const bounds = new LatLngBounds(
      markers.map((m) => [m.latitude, m.longitude] as [number, number])
    );
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
  }, [map, markers]);

  return null;
}

/**
 * Lightweight embeddable map showing all businesses with coordinates.
 * Static view (no user interactions) that auto-recenters when data changes.
 * Designed to be loaded via iframe on other pages (e.g., Blogs).
 */
export default function EmbeddedBusinessMap() {
  const { data, isLoading, isError } = useTravelSpots({ limit: 500 });

  // Filter businesses that have valid coordinates
  const markers = useMemo(() => {
    if (!data?.data) return [];
    return data.data.filter(
      (b) =>
        b.latitude !== null &&
        b.longitude !== null &&
        !isNaN(b.latitude) &&
        !isNaN(b.longitude)
    );
  }, [data]);

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-100">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-300 border-t-red-500" />
          <span className="text-sm text-slate-600">Loading map...</span>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-100">
        <p className="text-sm text-red-600">Unable to load businesses.</p>
      </div>
    );
  }

  return (
    <div className="h-screen w-full">
      <MapContainer
        center={DEFAULT_CENTER}
        zoom={DEFAULT_ZOOM}
        // Disable all user interactions for static view
        zoomControl={false}
        scrollWheelZoom={false}
        dragging={false}
        doubleClickZoom={false}
        touchZoom={false}
        boxZoom={false}
        keyboard={false}
        className="h-full w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png"
        />

        {/* Auto-recenter when markers change */}
        <AutoRecenter
          markers={markers.map((b) => ({
            latitude: b.latitude!,
            longitude: b.longitude!,
          }))}
        />

        {markers.map((business) => (
          <Marker
            key={business.business_id}
            position={[business.latitude!, business.longitude!]}
            icon={businessIcon}
          >
            <Popup>
              <div className="min-w-[160px]">
                <h3 className="font-semibold text-slate-800">{business.name}</h3>
                {business.city && (
                  <p className="text-xs text-slate-500">{business.city}</p>
                )}
                {business.rating !== null && (
                  <p className="mt-1 text-xs text-amber-600">
                    ★ {Number(business.rating).toFixed(1)}
                  </p>
                )}
                <a
                  href={`/business/${business.business_id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-block text-xs font-medium text-red-600 hover:underline"
                >
                  View Details →
                </a>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* Floating legend */}
      <div className="absolute bottom-4 left-4 z-[1000] rounded-lg bg-white/90 px-3 py-2 text-xs shadow-md backdrop-blur">
        <span className="font-medium text-slate-700">
          {markers.length} business{markers.length !== 1 ? "es" : ""} shown
        </span>
      </div>
    </div>
  );
}
