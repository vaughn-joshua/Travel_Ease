import { Routes, Route } from "react-router-dom";
import Blogs from "./pages/Blogs";
import "./App.css";

function App() {
  return (
    <main>
      <Routes>
        <Route path="/blogs" element={<Blogs />} />
      </Routes>
    </main>
  );
}

export default App;
