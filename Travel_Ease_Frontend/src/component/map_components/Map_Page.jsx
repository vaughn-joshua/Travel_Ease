import React, { useState, useCallback } from "react";
import Pin_Icon from "../../assets/pin.png";
import Man from "../../assets/man.png";
import "leaflet/dist/leaflet.css";
import { MapContainer, Marker, TileLayer, Popup, ZoomControl, GeoJSON, useMap } from "react-leaflet";
import L, { Icon } from "leaflet";
import "leaflet-routing-machine";
import Routing_Machine from "./Routing_Machine.jsx";
import { Map_Mover } from "./Map_Mover.jsx";
import "leaflet-routing-machine/dist/leaflet-routing-machine.css";
import MapClickHandler from "./MapClickHandler.jsx";

// Component to fit map bounds to route
function RouteFitter({ route }) {
  const map = useMap();

  React.useEffect(() => {
    if (route?.geometry?.coordinates) {
      const coords = route.geometry.coordinates.map(([lng, lat]) => [lat, lng]);
      if (coords.length > 0) {
        const bounds = L.latLngBounds(coords);
        map.fitBounds(bounds, { padding: [50, 50] });
      }
    }
  }, [map, route]);

  return null;
}

// Render backend-provided route geometry as polyline
function BackendRoute({ route }) {
  if (!route?.geometry) return null;

  const geojsonStyle = {
    color: '#3b82f6',
    weight: 5,
    opacity: 0.8,
  };

  return (
    <GeoJSON
      key={JSON.stringify(route.geometry)}
      data={route.geometry}
      style={geojsonStyle}
    />
  );
}

function Map_Page({ 
  search_result, 
  start, 
  end, 
  route,           // Route data from backend (optional)
  searchMarkers,   // Multiple search result markers (optional)
  onMapClear,
  onMarkerClick,   // Callback when marker clicked
  error,           // Error message to display
}) {
  const [activePopup, setActivePopup] = useState(null);

  const Tagaytay_Center = [14.1154, 120.9620];
  const zoom = 13;
  const Max_Zoom = 13;
  const Max_Bounds = [
    [14.052170, 120.876775],
    [14.182010, 121.048989]
  ];

  const custom_icon = new Icon({
    iconUrl: Pin_Icon,
    iconSize: [30, 30]
  });

  const custom_icon_person = new Icon({
    iconUrl: Man,
    iconSize: [30, 30]
  });

  // Create a highlighted version for route endpoints
  const route_start_icon = new Icon({
    iconUrl: Man,
    iconSize: [35, 35]
  });

  const route_end_icon = new Icon({
    iconUrl: Pin_Icon,
    iconSize: [35, 35]
  });

  const handleMarkerClick = useCallback((marker, index) => {
    setActivePopup(index);
    onMarkerClick?.(marker, index);
  }, [onMarkerClick]);

  // Determine if we should use backend route or client-side routing
  const useBackendRoute = route?.geometry;

  return (
    <div className="relative h-screen w-full">
      {/* Error overlay */}
      {error && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-[1000] bg-red-100 border border-red-300 text-red-700 px-4 py-2 rounded-md shadow-lg max-w-md">
          <div className="flex items-center gap-2">
            <span className="text-lg">⚠️</span>
            <span className="text-sm">{error}</span>
          </div>
        </div>
      )}

      {/* Route info overlay */}
      {route && (route.distanceFormatted || route.durationFormatted) && (
        <div className="absolute top-4 right-4 z-[1000] bg-white border border-gray-200 px-4 py-2 rounded-md shadow-lg">
          <div className="text-sm">
            <div className="font-medium text-gray-700">Route Info</div>
            <div className="flex gap-4 mt-1">
              {route.durationFormatted && (
                <span className="text-green-600">
                  🕐 {route.durationFormatted}
                </span>
              )}
              {route.distanceFormatted && (
                <span className="text-blue-600">
                  📏 {route.distanceFormatted}
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      <MapContainer
        center={Tagaytay_Center}
        zoom={zoom}
        style={{ height: "100%", width: "100%" }}
        maxBounds={Max_Bounds}
        maxBoundsViscosity={1.0}
        minZoom={Max_Zoom}
        zoomControl={false}
        className="static"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png"
        />
        <ZoomControl position="bottomright" />

        {/* Single search result marker */}
        {search_result && (
          <Marker position={search_result} icon={custom_icon}>
            <Popup>📍 You searched here!</Popup>
          </Marker>
        )}

        {/* Multiple search result markers */}
        {searchMarkers?.map((marker, index) => (
          <Marker
            key={marker.id || index}
            position={[marker.lat, marker.lng]}
            icon={custom_icon}
            eventHandlers={{
              click: () => handleMarkerClick(marker, index),
            }}
          >
            <Popup>
              <div className="max-w-xs">
                <strong className="block truncate">{marker.name}</strong>
                {marker.label && (
                  <small className="text-gray-500 block truncate">
                    {marker.label}
                  </small>
                )}
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Route start marker */}
        {start && (
          <Marker position={start} icon={route_start_icon}>
            <Popup>🚀 Start point</Popup>
          </Marker>
        )}

        {/* Route end marker */}
        {end && (
          <Marker position={end} icon={route_end_icon}>
            <Popup>🏁 Destination</Popup>
          </Marker>
        )}

        {/* Route display - prefer backend geometry if available */}
        {useBackendRoute ? (
          <>
            <BackendRoute route={route} />
            <RouteFitter route={route} />
          </>
        ) : (
          <Routing_Machine start={start} end={end} />
        )}

        <Map_Mover position={search_result} />
        <MapClickHandler onClear={onMapClear} />
      </MapContainer>
    </div>
  );
}

export default Map_Page;
