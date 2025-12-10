import React from "react";
import "leaflet/dist/leaflet.css";
import { MapContainer, TileLayer, Marker, ZoomControl, useMap, Popup } from "react-leaflet";
import { Icon, LatLngBoundsExpression, LatLngExpression } from "leaflet";
import Pin_Icon from "../../assets/pin.png";
import Man from "../../assets/man.png";
import { MapMover } from "./MapMover";
import RoutingMachine, { RouteInfo } from "./RoutingMachine";
import type { MapMarker } from "../../pages/LandingPage";

interface MapPageProps {
  search_result?: [number, number] | { lat: number; lng: number } | null;
  start?: [number, number] | null;
  end?: [number, number] | null;
  businessMarkers?: MapMarker[];
  mapCenter?: [number, number] | null;
  onMapClear?: () => void;
  onRouteFound?: (routeInfo: RouteInfo) => void;
  onMarkerClick?: (marker: MapMarker) => void;
}

const custom_icon = new Icon({
  iconUrl: Pin_Icon,
  iconSize: [30, 30],
});

const custom_icon_person = new Icon({
  iconUrl: Man,
  iconSize: [30, 30],
});

// Component to enable scroll wheel zoom
function ScrollWheelZoom() {
  const map = useMap();
  
  React.useEffect(() => {
    map.scrollWheelZoom.enable();
    const container = map.getContainer();
    container.style.outline = 'none';
    
    return () => {
      map.scrollWheelZoom.disable();
    };
  }, [map]);
  
  return null;
}

export default function Map_Page({
  search_result,
  start,
  end,
  businessMarkers = [],
  mapCenter,
  onRouteFound,
  onMarkerClick,
}: MapPageProps): React.ReactElement {
  const Tagaytay_Center: LatLngExpression = [14.1154, 120.962];
  const zoom = 14;
  const Min_Zoom = 12;
  const Max_Zoom = 19;
  const Max_Bounds: LatLngBoundsExpression = [
    [14.0, 120.8],
    [14.25, 121.1],
  ];

  const getPosition = (): LatLngExpression | null => {
    if (!search_result) return null;
    if (Array.isArray(search_result)) return search_result;
    return [search_result.lat, search_result.lng];
  };

  const position = getPosition();

  const handleRouteFound = (routeInfo: RouteInfo) => {
    if (onRouteFound) {
      onRouteFound(routeInfo);
    }
  };

  return (
    <div className="[&_.leaflet-pane]:z-[1] [&_.leaflet-control]:z-[1] [&_.leaflet-routing-container]:z-[1000] [&_.leaflet-top.leaflet-right]:top-4 [&_.leaflet-top.leaflet-right]:right-4">
      <MapContainer
        center={Tagaytay_Center}
        zoom={zoom}
        maxBounds={Max_Bounds}
        maxBoundsViscosity={1.0}
        minZoom={Min_Zoom}
        maxZoom={Max_Zoom}
        zoomControl={false}
        scrollWheelZoom={true}
        className="w-full h-full"
        style={{ 
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
        }}
      >
        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png"
        />

        <ScrollWheelZoom />
        <ZoomControl position="topright" />

        {/* Start marker (person icon) */}
        {start && (
          <Marker position={start as LatLngExpression} icon={custom_icon_person}>
            <Popup className="custom-popup">
              <div className="p-1">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-green-100 flex items-center justify-center">
                    <span className="text-green-600 text-xs">A</span>
                  </div>
                  <span className="font-semibold text-gray-900 text-sm">Start Point</span>
                </div>
              </div>
            </Popup>
          </Marker>
        )}

        {/* End marker (pin icon) */}
        {end && (
          <Marker position={end as LatLngExpression} icon={custom_icon}>
            <Popup className="custom-popup">
              <div className="p-1">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-red-100 flex items-center justify-center">
                    <span className="text-red-600 text-xs">B</span>
                  </div>
                  <span className="font-semibold text-gray-900 text-sm">Destination</span>
                </div>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Search result marker (if no route is active) */}
        {position && !start && !end && (
          <Marker position={position} icon={custom_icon}>
            <Popup className="custom-popup">
              <div className="p-1">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-primary-red/10 flex items-center justify-center">
                    <svg className="w-3.5 h-3.5 text-primary-red" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    </svg>
                  </div>
                  <span className="font-semibold text-gray-900 text-sm">Selected Location</span>
                </div>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Center map on search result or mapCenter */}
        {(position || mapCenter) && <MapMover position={position || mapCenter || null} />}

        {/* Render business markers */}
        {businessMarkers.map((marker, index) => (
          <Marker
            key={`business-${index}-${marker.position[0]}-${marker.position[1]}`}
            position={marker.position as LatLngExpression}
            icon={custom_icon}
            eventHandlers={{
              click: () => {
                if (onMarkerClick) {
                  onMarkerClick(marker);
                }
              },
            }}
          >
            {marker.name && (
              <Popup className="custom-popup">
                <div className="min-w-[180px] max-w-[220px]">
                  {/* Header */}
                  <div className="flex items-start gap-2 mb-2">
                    <div className="w-8 h-8 rounded-lg bg-primary-red/10 flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 text-primary-red" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-gray-900 text-sm line-clamp-2 leading-tight">
                        {marker.name}
                      </h4>
                      <span className="text-[10px] text-primary-red font-medium uppercase tracking-wide">
                        Local Business
                      </span>
                    </div>
                  </div>
                  
                  {/* Action */}
                  {onMarkerClick && (
                    <button
                      className="
                        w-full mt-2 py-2 px-3 
                        bg-primary-red text-white 
                        text-xs font-semibold 
                        rounded-lg
                        hover:bg-primary-red-dark 
                        transition-colors
                        flex items-center justify-center gap-1.5
                      "
                      onClick={(e) => {
                        e.stopPropagation();
                        onMarkerClick(marker);
                      }}
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      Add to Travel Plan
                    </button>
                  )}
                </div>
              </Popup>
            )}
          </Marker>
        ))}

        {start && end && (
          <RoutingMachine start={start} end={end} onRouteFound={handleRouteFound} />
        )}
      </MapContainer>
    </div>
  );
}
