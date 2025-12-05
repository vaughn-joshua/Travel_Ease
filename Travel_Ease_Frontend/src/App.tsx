import { Routes, Route, useLocation } from "react-router-dom";
import Navbar from "./components/blog/Navbar";
import Footer from "./components/blog/Footer";
import { RequireAuth, LandingRoute } from "./routes/AuthRoutes";

// Blog pages
import Blogs from "./pages/Blogs";
import BlogDetail from "./pages/BlogDetail";
import NewBlog from "./pages/NewBlog";
import EditBlog from "./pages/EditBlog";

// Business pages
import Businesses from "./pages/Businesses";
import BusinessDetail from "./pages/BusinessDetail";
import BusinessForm from "./pages/BusinessForm";
import BusinessOnboarding from "./pages/BusinessOnboarding";
import MyBusinesses from "./pages/MyBusinesses";
import BusinessPage from "./pages/BusinessPage";

// Travel plan pages
import MainPage from "./pages/MainPage";
import Planner from "./pages/Planner";
import MainLandingPage from "./pages/MainLandingPage";

// Map pages
import MainMapPage from "./components/map/MainMapPage";

// Travel spots
import MainTravelSpots from "./pages/travel-spots/MainTravelSpots";

// Auth pages
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Profile from "./pages/Profile";
import Contact from "./pages/Contact";
// Business landing
import LandingPage from "./pages/LandingPage";

// Auth
import AuthCallback from "./pages/AuthCallback";
import Onboarding from "./pages/Onboarding";

import "./App.css";

// Pages that should be fullscreen (no navbar/footer)
const fullscreenRoutes = ["/map"];

export default function App(): React.ReactElement {
  const location = useLocation();
  const isFullscreen = fullscreenRoutes.some(route => location.pathname.startsWith(route));

  // Fullscreen layout (for map) - requires auth
  if (isFullscreen) {
    return (
      <Routes>
        <Route path="/map" element={
          <RequireAuth>
            <MainMapPage />
          </RequireAuth>
        } />
        <Route path="/map/div" element={
          <RequireAuth>
            <MainLandingPage />
          </RequireAuth>
        } />
      </Routes>
    );
  }

  // Normal layout with navbar and footer
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow">
        <Routes>
          {/* Landing route: blogs for visitors, travel plans for authenticated */}
          <Route path="/" element={<LandingRoute publicComponent={<Blogs />} />} />

          {/* Plans dashboard - requires auth */}
          <Route path="/plans" element={
            <RequireAuth>
              <MainPage />
            </RequireAuth>
          } />

          {/* Planner - requires auth */}
          <Route path="/planner/:status/:id" element={
            <RequireAuth>
              <Planner />
            </RequireAuth>
          } />

          {/* Travel spots - public */}
          <Route path="/travel_spots_page" element={<MainTravelSpots />} />

          {/* Business landing/registration */}
          <Route path="/business_landing_page" element={<LandingPage />} />
          <Route path="/business/:id" element={<BusinessPage />} />

          {/* Blog routes - public */}
          <Route path="/blogs" element={<Blogs />} />
          <Route path="/blogs/new" element={<NewBlog />} />
          <Route path="/blogs/:slug/edit" element={<EditBlog />} />
          <Route path="/blogs/:slug" element={<BlogDetail />} />

          {/* Business directory routes */}
          <Route path="/businesses" element={<Businesses />} />
          <Route path="/businesses/onboarding" element={<BusinessOnboarding />} />
          <Route path="/businesses/new" element={<BusinessOnboarding />} />
          <Route path="/businesses/my" element={<MyBusinesses />} />
          <Route path="/businesses/:id" element={<BusinessDetail />} />
          <Route path="/businesses/:id/edit" element={<BusinessForm />} />

          {/* Auth routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/onboarding" element={<Onboarding />} />

          {/* Contact */}
          <Route path="/contact" element={<Contact />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}
