import { useState } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import { Icon, LatLngExpression } from "leaflet";
import Pin_Icon from "../../assets/pin.png";
import "leaflet/dist/leaflet.css";

interface RegisterMapProps {
  onSubmit: (location: { lat: number; lng: number }) => void;
  onBack: () => void;
  onClose: () => void;
}

interface MapClickHandlerProps {
  onLocationSelect: (lat: number, lng: number) => void;
}

function MapClickHandler({ onLocationSelect }: MapClickHandlerProps): null {
  useMapEvents({
    click: (e) => {
      onLocationSelect(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

const custom_icon = new Icon({
  iconUrl: Pin_Icon,
  iconSize: [30, 30],
});

export default function Register_Map({
  onSubmit,
  onBack,
  onClose,
}: RegisterMapProps): React.ReactElement {
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);

  const Tagaytay_Center: LatLngExpression = [14.1154, 120.962];

  const handleLocationSelect = (lat: number, lng: number): void => {
    setLocation({ lat, lng });
  };

  const handleSubmit = (): void => {
    if (location) {
      onSubmit(location);
    } else {
      alert("Please select a location on the map");
    }
  };

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-red-600 text-center">
        Select Location
      </h1>

      <p className="text-sm text-gray-600 text-center">
        Click on the map to set your business location
      </p>

      <div className="h-64 rounded-lg overflow-hidden border border-gray-300">
        <MapContainer
          center={Tagaytay_Center}
          zoom={14}
          className="w-full h-full"
        >
          <TileLayer
            attribution="&copy; OpenStreetMap contributors"
            url="https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png"
          />
          <MapClickHandler onLocationSelect={handleLocationSelect} />
          {location && (
            <Marker
              position={[location.lat, location.lng]}
              icon={custom_icon}
            />
          )}
        </MapContainer>
      </div>

      {location && (
        <p className="text-sm text-green-600 text-center">
          Selected: {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
        </p>
      )}

      <div className="flex justify-end gap-2 pt-4">
        <button type="button" onClick={onClose} className="soft_btn">
          Cancel
        </button>
        <button type="button" onClick={onBack} className="soft_btn">
          Back
        </button>
        <button type="button" onClick={handleSubmit} className="hard_btn">
          Submit
        </button>
      </div>
    </div>
  );
}

