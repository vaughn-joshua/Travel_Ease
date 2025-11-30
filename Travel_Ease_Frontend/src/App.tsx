import { Routes, Route, useLocation } from "react-router-dom";
import Navbar from "./component/blog/Navbar";
import Footer from "./component/blog/Footer";

// Blog pages
import Blogs from "./pages/Blogs";
import BlogDetail from "./pages/BlogDetail";
import NewBlog from "./pages/NewBlog";
import EditBlog from "./pages/EditBlog";

// Business pages
import Businesses from "./pages/Businesses";
import BusinessDetail from "./pages/BusinessDetail";
import BusinessForm from "./pages/BusinessForm";
import MyBusinesses from "./pages/MyBusinesses";
import Business_Page from "./pages/Business_Page";

// Travel plan pages
import Main_Page from "./pages/Main_Page";
import Planner from "./pages/Planner";
import Main_Landing_Page from "./pages/Main_Landing_Page";

// Map pages
import Main_Map_Page from "./component/map_components/Main_Map_Page";

// Travel spots
import Main_Travel_Spots from "./pages/Travel_Spots/Main_Travel_Spots";

// Auth pages
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Profile from "./pages/Profile";
// Business landing
import Landing_Page from "./pages/Landing_Page";

// Auth
import AuthCallback from "./pages/AuthCallback";
import Onboarding from "./pages/Onboarding";

import "./App.css";

// Pages that should be fullscreen (no navbar/footer)
const fullscreenRoutes = ["/map"];

export default function App(): React.ReactElement {
  const location = useLocation();
  const isFullscreen = fullscreenRoutes.some(route => location.pathname.startsWith(route));

  // Fullscreen layout (for map)
  if (isFullscreen) {
    return (
      <Routes>
        <Route path="/map" element={<Main_Map_Page />} />
        <Route path="/map/div" element={<Main_Landing_Page />} />
      </Routes>
    );
  }

  // Normal layout with navbar and footer
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow">
        <Routes>
          {/* Travel Plan routes */}
          <Route path="/" element={<Main_Page />} />
          <Route path="/planner/:status/:id" element={<Planner />} />

          {/* Travel spots */}
          <Route path="/travel_spots_page" element={<Main_Travel_Spots />} />

          {/* Business landing/registration */}
          <Route path="/business_landing_page" element={<Landing_Page />} />
          <Route path="/business/:id" element={<Business_Page />} />

          {/* Blog routes */}
          <Route path="/blogs" element={<Blogs />} />
          <Route path="/blogs/new" element={<NewBlog />} />
          <Route path="/blogs/:slug/edit" element={<EditBlog />} />
          <Route path="/blogs/:slug" element={<BlogDetail />} />

          {/* Business directory routes */}
          <Route path="/businesses" element={<Businesses />} />
          <Route path="/businesses/new" element={<BusinessForm />} />
          <Route path="/businesses/my" element={<MyBusinesses />} />
          <Route path="/businesses/:id" element={<BusinessDetail />} />
          <Route path="/businesses/:id/edit" element={<BusinessForm />} />

          {/* Auth routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/onboarding" element={<Onboarding />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}
