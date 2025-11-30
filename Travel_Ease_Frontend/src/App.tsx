import { Routes, Route } from "react-router-dom";
import Navbar from "./component/blog/Navbar";
import Footer from "./component/blog/Footer";
import Blogs from "./pages/Blogs";
import BlogDetail from "./pages/BlogDetail";
import NewBlog from "./pages/NewBlog";
import EditBlog from "./pages/EditBlog";
import Businesses from "./pages/Businesses";
import BusinessDetail from "./pages/BusinessDetail";
import BusinessForm from "./pages/BusinessForm";
import AuthCallback from "./pages/AuthCallback";
import "./App.css";

export default function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow">
        <Routes>
          <Route path="/" element={<Blogs />} />
          <Route path="/blogs" element={<Blogs />} />
          <Route path="/blogs/new" element={<NewBlog />} />
          <Route path="/blogs/:slug/edit" element={<EditBlog />} />
          <Route path="/blogs/:slug" element={<BlogDetail />} />
          
          {/* Business routes */}
          <Route path="/businesses" element={<Businesses />} />
          <Route path="/businesses/new" element={<BusinessForm />} />
          <Route path="/businesses/:id" element={<BusinessDetail />} />
          <Route path="/businesses/:id/edit" element={<BusinessForm />} />
          
          {/* Auth routes */}
          <Route path="/auth/callback" element={<AuthCallback />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}
