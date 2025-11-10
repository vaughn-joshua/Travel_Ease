import { Routes, Route } from "react-router-dom";
import "./App.css";
import Landing_Page from "./pages/Landing_Page.";
import Business_Page from "./pages/Business_Page";

function App() {
  return (
    <main>
      <Routes>
        <Route path="/" element={<Landing_Page />} />
        <Route path="/business" element={<Business_Page />} />
        <Route />
      </Routes>
    </main>
  );
}

export default App;
