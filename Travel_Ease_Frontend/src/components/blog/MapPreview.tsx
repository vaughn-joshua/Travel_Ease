import { useMemo } from "react";
import { MapContainer, Marker, TileLayer, Popup } from "react-leaflet";
import { Icon, LatLngExpression } from "leaflet";
import "leaflet/dist/leaflet.css";

import { useTravelSpots } from "../../features/businesses/queries";
import Pin_Icon from "../../assets/pin.png";

const PREVIEW_CENTER: LatLngExpression = [14.1154, 120.962];
const PREVIEW_ZOOM = 13;

const previewIcon = new Icon({
  iconUrl: Pin_Icon,
  iconSize: [30, 30],
  iconAnchor: [15, 30],
  popupAnchor: [0, -26],
});

interface MapPreviewProps {
  className?: string;
}

export default function MapPreview({ className }: MapPreviewProps): React.ReactElement {
  const { data, isLoading, isError } = useTravelSpots({ limit: 100 });

  const markers = useMemo(() => {
    if (!data?.data) return [];
    return data.data.filter(
      (business) =>
        business.latitude != null &&
        business.longitude != null &&
        !Number.isNaN(business.latitude) &&
        !Number.isNaN(business.longitude)
    );
  }, [data]);

  return (
    <div
      className={`relative h-[320px] w-full overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-inner ${
        className ?? ""
      }`}
    >
      {isLoading ? (
        <div className="flex h-full items-center justify-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-red-500" />
        </div>
      ) : isError ? (
        <div className="flex h-full items-center justify-center px-6 text-center text-sm text-gray-500">
          We couldn’t load the map right now. Please try again later.
        </div>
      ) : (
        <MapContainer
          center={PREVIEW_CENTER}
          zoom={PREVIEW_ZOOM}
          scrollWheelZoom={false}
          doubleClickZoom={false}
          className="h-full w-full"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png"
          />
          {markers.map((business) => (
            <Marker
              key={business.business_id}
              position={[business.latitude!, business.longitude!] as LatLngExpression}
              icon={previewIcon}
            >
              <Popup>
                <div className="min-w-[160px]">
                  <p className="font-medium text-gray-900 text-sm">{business.name}</p>
                  {business.city && (
                    <p className="text-xs text-gray-500 mt-1">{business.city}</p>
                  )}
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      )}
    </div>
  );
}


