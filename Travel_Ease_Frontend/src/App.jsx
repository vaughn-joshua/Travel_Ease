import { Routes, Route } from "react-router-dom";
import "./App.css";
import Main_Page from "./pages/Main_Page.jsx";
import Planner from "./pages/Planner.jsx";
import Blogs from "./pages/Blogs.jsx";
import Spots from "./pages/Spots.jsx";
import Map from "./pages/Map.jsx";
import About from "./pages/About.jsx";
import FAQs from "./pages/FAQs.jsx";

function App() {
  return (
    <main>
      <Routes>
        <Route path="/" element={<Main_Page />} />
        <Route path="/planner/:status/:id" element={<Planner />} />
        <Route path="/blogs" element={<Blogs />} />
        <Route path="/spots" element={<Spots />} />
        <Route path="/map" element={<Map />} />
        <Route path="/about" element={<About />} />
        <Route path="/faqs" element={<FAQs />} />
      </Routes>
    </main>
  );
}

export default App;
