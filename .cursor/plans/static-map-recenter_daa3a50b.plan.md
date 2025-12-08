---
name: static-map-recenter
overview: Make the embedded business map static (no user zoom) but auto recenters when data updates.
todos:
  - id: fix-backend-coords
    content: Remap longtitude to longitude in API responses
    status: completed
  - id: update-types
    content: Allow frontend types to handle longtitude fallback
    status: completed
  - id: render-markers
    content: Use normalized coords in embedded map component
    status: completed
---

# Static Embedded Map With Auto Recenter

## Steps

1. **Disable Interactive Controls**

- Remove zoom control and turn off user interactions (drag, scroll, double-click, keyboard) for the embedded map so it behaves as a static view.
- File: [`Travel_Ease_Frontend/src/pages/EmbeddedBusinessMap.tsx`](Travel_Ease_Frontend/src/pages/EmbeddedBusinessMap.tsx)

2. **Auto-Recenter on Data Changes**

- Compute the geographic midpoint (or fit bounds) of returned businesses and programmatically set the map view whenever the marker set changes; keep an initial fallback center when no data is present.
- File: [`Travel_Ease_Frontend/src/pages/EmbeddedBusinessMap.tsx`](Travel_Ease_Frontend/src/pages/EmbeddedBusinessMap.tsx)