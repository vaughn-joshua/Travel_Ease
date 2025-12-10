import { lazy, Suspense } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import Navbar from "./components/blog/Navbar";
import Footer from "./components/blog/Footer";
import { RequireAuth, RequireSupabaseAuth, LandingRoute } from "./routes/AuthRoutes";

// Blogs is the landing page for guests - keep eager for fast first paint
import Blogs from "./pages/Blogs";

import "./App.css";

// ---------------------------------------------------------------------------
// Lightweight loading fallback (minimal footprint)
// ---------------------------------------------------------------------------
function PageLoader() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary-red border-t-transparent" />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Lazy-loaded pages – only fetched when the route is visited
// ---------------------------------------------------------------------------

// Blog pages (detail/edit are less common visits)
const BlogDetail = lazy(() => import("./pages/BlogDetail"));
const NewBlog = lazy(() => import("./pages/NewBlog"));
const EditBlog = lazy(() => import("./pages/EditBlog"));

// Business pages
const Businesses = lazy(() => import("./pages/Businesses"));
const BusinessDetail = lazy(() => import("./pages/BusinessDetail"));
const BusinessForm = lazy(() => import("./pages/BusinessForm"));
const MyBusinesses = lazy(() => import("./pages/MyBusinesses"));
const BusinessPage = lazy(() => import("./pages/BusinessPage"));

// Travel plan pages (heavy – likely uses maps)
const MainPage = lazy(() => import("./pages/MainPage"));
const Planner = lazy(() => import("./pages/Planner"));
const MainLandingPage = lazy(() => import("./pages/MainLandingPage"));

// Map pages (very heavy – Leaflet)
const MainMapPage = lazy(() => import("./components/map/MainMapPage"));

// Travel spots
const MainTravelSpots = lazy(() => import("./pages/travel-spots/MainTravelSpots"));

// Auth pages
const Login = lazy(() => import("./pages/Login"));
const Signup = lazy(() => import("./pages/Signup"));
const Profile = lazy(() => import("./pages/Profile"));
const Favorites = lazy(() => import("./pages/Favorites"));
const Contact = lazy(() => import("./pages/Contact"));

// Business landing (map component)
const LandingPage = lazy(() => import("./pages/LandingPage"));

// Auth callback / onboarding
const AuthCallback = lazy(() => import("./pages/AuthCallback"));
const Onboarding = lazy(() => import("./pages/Onboarding"));

// Embeddable pages
const EmbeddedBusinessMap = lazy(() => import("./pages/EmbeddedBusinessMap"));

// ---------------------------------------------------------------------------
// Fullscreen routes (no navbar/footer)
// ---------------------------------------------------------------------------
const fullscreenRoutes = ["/map", "/embed"];

export default function App(): React.ReactElement {
  const location = useLocation();
  const isFullscreen = fullscreenRoutes.some((route) =>
    location.pathname.startsWith(route)
  );

  // Fullscreen layout (for map and embeds) – some require auth
  if (isFullscreen) {
    return (
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route
            path="/map"
            element={
              <RequireAuth>
                <MainMapPage />
              </RequireAuth>
            }
          />
          <Route
            path="/map/div"
            element={
              <RequireAuth>
                <MainLandingPage />
              </RequireAuth>
            }
          />
          {/* Embeddable pages – public, no auth required */}
          <Route path="/embed/business-map" element={<EmbeddedBusinessMap />} />
        </Routes>
      </Suspense>
    );
  }

  // Normal layout with navbar and footer
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow">
        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* Landing route: blogs for visitors, travel plans for authenticated */}
            <Route
              path="/"
              element={<LandingRoute publicComponent={<Blogs />} />}
            />

            {/* Plans dashboard – requires auth */}
            <Route
              path="/plans"
              element={
                <RequireAuth>
                  <MainPage />
                </RequireAuth>
              }
            />

            {/* Planner – requires auth */}
            <Route
              path="/planner/:status/:id"
              element={
                <RequireAuth>
                  <Planner />
                </RequireAuth>
              }
            />

            {/* Travel spots – public */}
            <Route path="/travel_spots_page" element={<MainTravelSpots />} />

            {/* Business landing/registration */}
            <Route path="/business_landing_page" element={<LandingPage />} />
            <Route path="/business/:id" element={<BusinessPage />} />

            {/* Blog routes – public */}
            <Route path="/blogs" element={<Blogs />} />
            <Route path="/blogs/new" element={<NewBlog />} />
            <Route path="/blogs/:slug/edit" element={<EditBlog />} />
            <Route path="/blogs/:slug" element={<BlogDetail />} />

            {/* Business directory routes */}
            {/* Public: browse businesses */}
            <Route path="/businesses" element={<Businesses />} />
            <Route path="/businesses/:id" element={<BusinessDetail />} />
            
            {/* Protected: business management (requires Google OAuth) */}
            <Route
              path="/businesses/onboarding"
              element={
                <RequireSupabaseAuth fallbackPath="/businesses">
                  <BusinessForm />
                </RequireSupabaseAuth>
              }
            />
            <Route
              path="/businesses/new"
              element={
                <RequireSupabaseAuth fallbackPath="/businesses">
                  <BusinessForm />
                </RequireSupabaseAuth>
              }
            />
            <Route
              path="/businesses/my"
              element={
                <RequireSupabaseAuth fallbackPath="/businesses">
                  <MyBusinesses />
                </RequireSupabaseAuth>
              }
            />
            <Route
              path="/businesses/:id/edit"
              element={
                <RequireSupabaseAuth fallbackPath="/businesses">
                  <BusinessForm />
                </RequireSupabaseAuth>
              }
            />

            {/* Auth routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/user/favorites" element={<Favorites />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="/onboarding" element={<Onboarding />} />

            {/* Contact */}
            <Route path="/contact" element={<Contact />} />
          </Routes>
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
