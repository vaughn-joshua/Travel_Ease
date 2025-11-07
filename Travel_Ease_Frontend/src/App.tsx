import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Blogs from "./pages/Blogs";
import BlogDetail from "./pages/BlogDetail";
import NewBlog from "./pages/NewBlog";
import EditBlog from "./pages/EditBlog";
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
        </Routes>
      </main>
      <Footer />
    </div>
  );
}
