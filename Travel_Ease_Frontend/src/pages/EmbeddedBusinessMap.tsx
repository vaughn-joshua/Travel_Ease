import { useMemo } from "react";
import "leaflet/dist/leaflet.css";
import { MapContainer, TileLayer, Marker, Popup, ZoomControl } from "react-leaflet";
import { Icon, LatLngBoundsExpression, LatLngExpression } from "leaflet";
import { useTravelSpots } from "../features/businesses/queries";
import Pin_Icon from "../assets/pin.png";

const businessIcon = new Icon({
  iconUrl: Pin_Icon,
  iconSize: [28, 28],
});

/**
 * Lightweight embeddable map showing all businesses with coordinates.
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

  // Map configuration for Tagaytay area
  const center: LatLngExpression = [14.1154, 120.962];
  const zoom = 13;
  const minZoom = 11;
  const maxZoom = 18;
  const maxBounds: LatLngBoundsExpression = [
    [13.9, 120.7],
    [14.35, 121.2],
  ];

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
        center={center}
        zoom={zoom}
        minZoom={minZoom}
        maxZoom={maxZoom}
        maxBounds={maxBounds}
        maxBoundsViscosity={0.9}
        zoomControl={false}
        scrollWheelZoom={true}
        className="h-full w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png"
        />
        <ZoomControl position="bottomright" />

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
                    ★ {business.rating.toFixed(1)}
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

