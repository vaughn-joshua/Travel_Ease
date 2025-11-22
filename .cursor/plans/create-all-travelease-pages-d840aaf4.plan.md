<!-- d840aaf4-a135-454d-ac2f-a54d1191bdb4 31711d86-260a-428d-a44c-21c921717199 -->
# Fix Map Maintenance Page

Update the Map page maintenance message to match the Blogs and Spots pages style.

## Changes Needed

**File: `Travel_Ease_Frontend/src/pages/Map.jsx`**

1. Change background from `bg-gray-50` to `bg-white` to match other maintenance pages
2. Replace the map image with a settings/gear icon SVG (same as Blogs/Spots pages)
3. Update layout structure to match Blogs/Spots:

- Use `min-h-[80vh]` container
- Update heading to just "Under Maintenance" (remove "Map" prefix)
- Update text color to `text-gray-600` for paragraph
- Add action buttons: "Return Home" and "Explore Spots"

4. Remove the image element and replace with the settings icon SVG
5. Match the exact spacing and styling from Blogs/Spots pages

## Implementation Details

- Use the same SVG icon structure as Blogs/Spots (settings/gear icon)
- Match button styles and layout
- Ensure consistent spacing and typography
- Keep Navbar and Footer unchanged

### To-dos

- [ ] Configure Tailwind with brand colors (#E10600, #B80500), Inter font, and custom utilities for glass effects, gradients, and shadows
- [ ] Build shared Navbar component with sticky translucent header, TE logo pill, navigation links with active states, CTAs, and mobile drawer menu
- [ ] Build shared Footer component with red subscription band, 4-column grid layout, social icons, and bottom bar
- [ ] Create reusable BlogCard component with 4:3 image, category chip, title, excerpt, meta row, and hover effects
- [ ] Implement Blogs page with hero section, glass card, stat trio, multiple content sections (Featured Stories, Discover Destinations, Travel Smarter, Client Education), and CTA bands
- [ ] Build Spots page adapting Blogs structure with spot-focused content, featured spots carousel/grid, and destination cards
- [ ] Build Map page with map-focused hero, featured locations section, and map integration placeholder
- [ ] Build About page with company story section, team cards, values section, and company-focused content
- [ ] Build FAQs page with accordion component for expandable Q&A items, categorized sections, and support-focused content
- [ ] Add all new page routes to App.jsx and ensure navigation links work correctly
- [ ] Configure Tailwind with brand colors (#E10600, #B80500), Inter font, and custom utilities for glass effects, gradients, and shadows
- [ ] Build shared Navbar component with sticky translucent header, TE logo pill, navigation links with active states, CTAs, and mobile drawer menu
- [ ] Build shared Footer component with red subscription band, 4-column grid layout, social icons, and bottom bar
- [ ] Create reusable BlogCard component with 4:3 image, category chip, title, excerpt, meta row, and hover effects
- [ ] Implement Blogs page with hero section, glass card, stat trio, multiple content sections (Featured Stories, Discover Destinations, Travel Smarter, Client Education), and CTA bands
- [ ] Build Spots page adapting Blogs structure with spot-focused content, featured spots carousel/grid, and destination cards
- [ ] Build Map page with map-focused hero, featured locations section, and map integration placeholder
- [ ] Build About page with company story section, team cards, values section, and company-focused content
- [ ] Build FAQs page with accordion component for expandable Q&A items, categorized sections, and support-focused content
- [ ] Add all new page routes to App.jsx and ensure navigation links work correctly