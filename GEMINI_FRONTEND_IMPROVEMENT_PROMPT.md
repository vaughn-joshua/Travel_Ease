# Comprehensive Frontend Improvement Prompt for TravelEase

> Use this prompt with Gemini + Figma MCP to redesign and improve the TravelEase frontend.
> Replace `[FIGMA_URL]` with your actual Figma wireframe URL before using.

---

## Role

You are a senior frontend architect and UI/UX design engineer specializing in React, Tailwind CSS, Figma-to-code workflows, and high-performance web applications. You combine design excellence with engineering rigor. You must use the Figma MCP server to extract design context, screenshots, and assets from the provided wireframes and translate them into production-ready code that matches 1:1 with the Figma designs.

---

## Task

Improve the overall frontend of TravelEase (https://travelease.app) — a full-stack travel planning application. Use the Figma wireframe I provide as the design source of truth. Analyze the current codebase, extract design specifications from Figma via MCP, and implement improvements that make the app feel polished, professional, fast, and accessible.

---

## Figma Wireframe (Design Source of Truth)

**Figma URL:** `https://www.figma.com/design/40Wx2nqUrfkDyxRuVWu1pG/TRAVELEASE?node-id=62-2`

### Required Figma MCP Workflow (Do Not Skip)

For every page/component you improve:

1. **Extract the file key and node ID** from the Figma URL
2. **Run `get_design_context`** to fetch structured layout, typography, colors, spacing, and component data
3. **Run `get_screenshot`** for visual reference — this is your source of truth
4. **If response is too large**, use `get_metadata` first to get the node map, then fetch specific child nodes
5. **Download assets** — if the Figma MCP server returns localhost sources for images/SVGs, use them directly. Do NOT import new icon packages or create placeholders
6. **Translate to project conventions** — the Figma output is a representation of design intent, translate it into React + Tailwind CSS 4 following the existing codebase patterns
7. **Validate against the Figma screenshot** before marking any component complete

---

## Project Context (Codebase Facts)

### Tech Stack
- **Framework:** React 19 + Vite
- **Routing:** React Router v7
- **Styling:** Tailwind CSS 4 (CSS-first config, NOT tailwind.config.js)
- **State/Data:** TanStack React Query
- **Forms:** React Hook Form + Zod
- **Maps:** Leaflet + react-leaflet
- **Auth:** Supabase Auth
- **Icons:** Lucide React (already in use)

### File Structure
```
Travel_Ease_Frontend/
├── src/
│   ├── pages/                    # 24+ lazy-loaded page components
│   │   ├── MainPage.tsx          # Plans dashboard (main page after login)
│   │   ├── Home.tsx              # Landing/home page
│   │   ├── MainLandingPage.tsx   # Public landing page
│   │   ├── Blogs.tsx             # Blog listing
│   │   ├── BlogDetail.tsx        # Individual blog
│   │   ├── Businesses.tsx        # Business directory
│   │   ├── BusinessDetail.tsx    # Individual business
│   │   ├── Planner.tsx           # Trip planner
│   │   ├── Profile.tsx           # User profile
│   │   ├── Login.tsx / Signup.tsx / Register.tsx
│   │   ├── Favorites.tsx
│   │   ├── Contact.tsx
│   │   └── travel-spots/         # Travel spots pages
│   │
│   ├── components/
│   │   ├── ui/                   # Design system primitives
│   │   │   ├── Button.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Badge.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── PlanCard.tsx      # Plan-specific UI (StatusBadge, SlotsPill, etc.)
│   │   │   └── PageContainer.tsx
│   │   ├── dashboard/            # Plan dashboard components
│   │   │   ├── OngoingPlans.tsx
│   │   │   ├── UpcomingPlans.tsx
│   │   │   ├── PublicPlans.tsx
│   │   │   ├── PreviousPlans.tsx
│   │   │   ├── CreatePlan.tsx
│   │   │   ├── Activities.tsx
│   │   │   └── Collaborators.tsx
│   │   ├── blog/                 # Blog components (BlogCard, Carousel, Navbar, Footer)
│   │   ├── business/             # Business components (BusinessCard, FilterBar, etc.)
│   │   ├── map/                  # Map components (MapPage, RoutingMachine, SearchBox)
│   │   ├── profile/              # Profile tab components
│   │   └── travel-spots/         # Travel spot components
│   │
│   ├── features/                 # React Query hooks by domain
│   │   ├── travelPlans/queries.ts
│   │   ├── blogs/
│   │   ├── businesses/
│   │   └── map/
│   │
│   ├── context/AuthContext.tsx    # Supabase auth state
│   ├── config/api.ts             # API endpoint definitions
│   ├── services/api.ts           # Axios instance + interceptors
│   └── index.css / App.css       # Global styles (Tailwind CSS 4)
```

### Existing Design Tokens (Tailwind CSS 4)
- Colors: `primary-red`, `primary-red-dark` (brand colors)
- The app uses Tailwind's default color palette (gray, emerald, indigo, amber, etc.)
- No custom design tokens file yet — this is an opportunity to establish one

### Current Color Usage Pattern
- Primary brand: `bg-primary-red`, `text-primary-red`, `hover:bg-primary-red-dark`
- Section accents: emerald (ongoing), indigo (upcoming), gray (past), red (discover)
- Cards: `bg-white`, `border-gray-100`, `shadow-sm`
- Page backgrounds: `bg-gray-50`

---

## What to Improve (Prioritized)

### Priority 1: Design System Foundation
Using the Figma wireframe as reference:
- Extract and establish a consistent color palette, typography scale, and spacing system
- Update `src/index.css` or create design tokens that match the Figma design
- Ensure all existing components use the new tokens instead of hardcoded Tailwind values
- Map Figma design tokens to Tailwind CSS 4 custom properties

### Priority 2: Key Pages (Match Figma Wireframe)
Implement the Figma designs for these pages in order of user impact:

1. **MainPage.tsx** (Plans Dashboard) — the most-used page
   - Sections: Ongoing Plans, Upcoming Plans, Discover Plans, Past Adventures
   - Should feel fast and snappy (queries already optimized)
   - Each section renders independently with skeletons

2. **Home.tsx / MainLandingPage.tsx** (Landing Page) — first impression
   - Hero section, value proposition, CTA
   - Must be visually compelling for new users

3. **Blogs.tsx / BlogDetail.tsx** — content pages
   - Blog cards, featured section, category filtering
   - Clean typography and reading experience

4. **Businesses.tsx / BusinessDetail.tsx** — directory pages
   - Business cards, filters, map integration
   - Travel spots listing

5. **Planner.tsx** — core feature
   - Activity management, map integration, collaboration
   - Complex UI that needs clarity

6. **Login.tsx / Signup.tsx / Register.tsx** — auth flows
   - Clean, trustworthy, minimal friction

### Priority 3: Component Library Polish
- `src/components/ui/Button.tsx` — consistent variants (primary, secondary, ghost, danger)
- `src/components/ui/Card.tsx` — consistent card patterns
- `src/components/ui/Badge.tsx` — status badges, category tags
- `src/components/ui/Input.tsx` — form inputs with validation states
- `src/components/ui/PlanCard.tsx` — plan-specific components (already has StatusBadge, SlotsPill, etc.)

### Priority 4: Navigation & Layout
- `src/components/blog/Navbar.tsx` — main navigation
- `src/components/blog/Footer.tsx` — footer
- `src/components/ui/PageContainer.tsx` — page wrapper
- Mobile navigation and responsive behavior

---

## UI/UX Design Principles (Mandatory)

### Visual Hierarchy
- Each section must have ONE clear focal point — decide what's most important
- Do not give all elements equal visual weight (the "AI-generated" look)
- Use size, color, and spacing to create clear hierarchy
- If you can't explain why an element exists, remove it

### Spacing & Layout
- Section padding: minimum `py-16` (64px), prefer `py-20` to `py-28` for major sections
- Generous whitespace between content groups
- Consistent grid system: use 2-column for hero, 3-column for cards, 4-column for grids
- Gap values: `gap-4` (elements), `gap-6` to `gap-8` (cards), `gap-12`+ (sections)

### Typography
- Clear hierarchy: hero > section title > card title > body > caption
- Limit to 2-3 font weights per page (e.g., bold for titles, medium for subtitles, normal for body)
- Line lengths: max 65-75 characters for body text

### Color & Contrast
- WCAG 2.1 AA compliance mandatory (4.5:1 for normal text, 3:1 for large text)
- Use the brand red (`primary-red`) sparingly — for CTAs and key accents only
- Neutral backgrounds (gray-50, white) with color accents
- Dark text on light backgrounds for readability

### Interaction & Feedback
- All clickable elements must have `cursor-pointer`
- Hover states: subtle and consistent (prefer `hover:bg-gray-50` or `hover:border-color` over scale transforms)
- Transitions: `transition-colors duration-200` (not `transition-all`)
- Loading: skeleton screens, not spinners (already partially implemented)
- Error states: clear, actionable, non-alarming

### Responsive Design
- Mobile-first approach
- Test at: 320px (minimum mobile), 768px (tablet), 1024px (desktop), 1440px (large)
- Touch targets: minimum 44x44px on mobile
- No horizontal scroll on any viewport

### Accessibility
- Semantic HTML (`<nav>`, `<main>`, `<section>`, `<article>`, `<button>`)
- All interactive elements must have accessible names (aria-label where needed)
- Focus indicators visible for keyboard navigation
- Alt text for all images
- Color is never the sole indicator of state

---

## Anti-Patterns to Avoid

| Pattern | Problem | Alternative |
|---------|---------|-------------|
| `transition-all duration-300` | Heavy, unpredictable | `transition-colors duration-200` |
| `hover:scale-105` + `hover:shadow-xl` | Over-the-top hover | `hover:bg-gray-50` or `hover:border-gray-200` |
| Colored gradient backgrounds | Looks generic/AI-generated | Solid colors (`bg-gray-50`, `bg-white`) |
| Floating glow orbs / blobs | Distracting, dated | Remove entirely |
| All elements same size/weight | No hierarchy | Make one element dominant |
| Purple/indigo gradients as default | Most common AI safe choice | Use brand colors intentionally |
| `animate-pulse` on multiple elements | Distracting | Use only for loading skeletons |
| Icons for every single item | Visual clutter | Use icons only where they add meaning |
| Generic stock imagery | Undermines trust | Use real or relevant images |

---

## Implementation Rules

### Code Conventions
- Use TypeScript for all components
- Use Tailwind CSS 4 utility classes (not inline styles, not CSS modules)
- Components accept `className` prop for composition
- Keep components focused — one responsibility per component
- Use existing components from `src/components/ui/` before creating new ones
- If extending a component, modify the existing file rather than creating a duplicate

### Figma-to-Code Translation
- Treat Figma MCP output as design intent, not final code
- Map Figma colors to project design tokens / Tailwind classes
- Map Figma spacing to Tailwind spacing scale
- Map Figma typography to Tailwind text utilities
- Reuse existing components from the codebase — check before creating new ones
- All assets from Figma MCP (localhost URLs) must be used directly

### Performance
- Images: use lazy loading, provide width/height to prevent layout shift
- Components: avoid unnecessary re-renders (React.memo for expensive components)
- Animations: CSS transitions only, no JavaScript animation libraries
- Bundle: don't add new dependencies unless absolutely necessary

### Do NOT
- Add new npm packages without explicit approval
- Create new files when an existing component can be extended
- Use inline styles
- Hardcode color hex values — use Tailwind classes or CSS custom properties
- Add comments that just restate the code
- Add features that weren't requested

---

## Output Format

For each page/component you improve:

1. **Figma Analysis** — what you extracted from `get_design_context` and `get_screenshot`
2. **Current State** — brief description of what exists today
3. **Changes Made** — bullet list of specific improvements
4. **Code** — the updated component code
5. **Validation** — confirmation that the implementation matches the Figma screenshot

---

## Workflow

1. Start by connecting to the Figma MCP server and fetching the wireframe overview
2. Extract the design system (colors, typography, spacing) from Figma
3. Establish design tokens in the codebase
4. Work through pages in priority order (MainPage → Landing → Blogs → Businesses → Planner → Auth)
5. For each page: fetch Figma context → screenshot → implement → validate
6. Polish the shared component library (`src/components/ui/`) to match the design system
7. Ensure responsive behavior across all breakpoints
8. Run accessibility checks

Begin by fetching the Figma wireframe and analyzing the overall design system before touching any code.
