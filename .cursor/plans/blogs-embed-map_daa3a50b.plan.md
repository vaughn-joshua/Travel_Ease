---
name: blogs-embed-map
overview: Add an embeddable business map and surface it on the Blogs page via iframe.
todos:
  - id: build-embed-map
    content: Create embeddable map page with business markers
    status: completed
  - id: wire-route
    content: Expose /embed/business-map route without navbar
    status: completed
  - id: integrate-iframe
    content: Add iframe section to blogs page
    status: completed
---

# Embed Business Map in Blogs Page

## Steps

1. **Create Embed Map Component**

- Add a lightweight map-only page that fetches businesses (via `useTravelSpots`) and renders Leaflet markers for each business with coordinates.
- File: [`Travel_Ease_Frontend/src/pages/EmbeddedBusinessMap.tsx`](Travel_Ease_Frontend/src/pages/EmbeddedBusinessMap.tsx)

2. **Expose Embed Route Without Chrome**

- Register a public route (e.g. `/embed/business-map`) that renders the new component without navbar/footer and ensure it is excluded from auth-only handling.
- File: [`Travel_Ease_Frontend/src/App.tsx`](Travel_Ease_Frontend/src/App.tsx)

3. **Embed Map in Blogs Page**

- Insert a new section on the blogs page that introduces the business map and loads it via an iframe aimed at the new route, with responsive sizing and graceful fallbacks.
- File: [`Travel_Ease_Frontend/src/pages/Blogs.tsx`](Travel_Ease_Frontend/src/pages/Blogs.tsx)