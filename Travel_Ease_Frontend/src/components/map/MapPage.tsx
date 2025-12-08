import React, { useEffect } from "react";
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
  mapCenter?: [number, number] | null; // For centering map without showing search result
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
    // Enable scroll wheel zoom
    map.scrollWheelZoom.enable();
    
    // Disable default scroll behavior on the map container
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
  onMapClear,
  onRouteFound,
  onMarkerClick,
}: MapPageProps): React.ReactElement {
  console.log("[MapPage] ========== MAP PAGE RENDER ==========");
  console.log("[MapPage] Props received:", {
    hasSearchResult: !!search_result,
    hasStart: !!start,
    hasEnd: !!end,
    businessMarkersCount: businessMarkers.length,
    hasMapCenter: !!mapCenter,
    hasOnRouteFound: !!onRouteFound,
  });

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

  // Log route props changes
  useEffect(() => {
    console.log("[MapPage] ========== ROUTE PROPS UPDATE ==========");
    console.log("[MapPage] start:", start);
    console.log("[MapPage] end:", end);
    console.log("[MapPage] start type:", typeof start, Array.isArray(start));
    console.log("[MapPage] end type:", typeof end, Array.isArray(end));
    
    if (start && end) {
      console.log("[MapPage] ✅ Route is active - both start and end provided");
      console.log("[MapPage] Start coordinates:", start);
      console.log("[MapPage] End coordinates:", end);
      console.log("[MapPage] RoutingMachine will be rendered");
    } else {
      console.log("[MapPage] ⏳ Route not active");
      if (!start) console.log("[MapPage] Missing start point");
      if (!end) console.log("[MapPage] Missing end point");
    }
  }, [start, end]);

  // Log when RoutingMachine callback is triggered
  const handleRouteFound = (routeInfo: RouteInfo) => {
    console.log("[MapPage] ========== ROUTE FOUND CALLBACK ==========");
    console.log("[MapPage] Route info received:", routeInfo);
    console.log("[MapPage] Distance:", routeInfo.distance, "km");
    console.log("[MapPage] Time:", routeInfo.time, "minutes");
    if (onRouteFound) {
      console.log("[MapPage] ✅ Calling parent onRouteFound callback");
      onRouteFound(routeInfo);
    } else {
      console.warn("[MapPage] ⚠️ No onRouteFound callback provided");
    }
  };

  return (
    <div className="[&_.leaflet-pane]:z-[1] [&_.leaflet-control]:z-[1] [&_.leaflet-routing-container]:z-[1000]">
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

      {/* Enable scroll wheel zoom */}
      <ScrollWheelZoom />

      {/* Zoom controls at bottom right */}
      <ZoomControl position="bottomright" />

      {/* Start marker (person icon) */}
      {start && (
        <Marker position={start as LatLngExpression} icon={custom_icon_person} />
      )}

      {/* End marker (pin icon) */}
      {end && <Marker position={end as LatLngExpression} icon={custom_icon} />}

      {/* Search result marker (if no route is active) */}
      {position && !start && !end && <Marker position={position} icon={custom_icon} />}

      {/* Center map on search result or mapCenter */}
      {(position || mapCenter) && <MapMover position={position || mapCenter || null} />}

      {/* Render business markers */}
      {businessMarkers.length > 0 && businessMarkers.map((marker, index) => {
        if (index === 0) {
          console.log(`[MapPage] Rendering ${businessMarkers.length} business markers`);
        }
        console.log(`[MapPage] Rendering marker ${index}:`, marker.name, marker.position);
        return (
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
              <Popup>
                <div className="text-sm font-medium">{marker.name}</div>
                {onMarkerClick && (
                  <button
                    className="mt-2 text-xs text-primary-red hover:underline"
                    onClick={(e) => {
                      e.stopPropagation();
                      onMarkerClick(marker);
                    }}
                  >
                    Add to Travel Plan
                  </button>
                )}
              </Popup>
            )}
          </Marker>
        );
      })}

      {(() => {
        if (start && end) {
          console.log("[MapPage] Rendering RoutingMachine with:", { start, end });
          return <RoutingMachine start={start} end={end} onRouteFound={handleRouteFound} />;
        }
        return null;
      })()}
      </MapContainer>
    </div>
  );
}
