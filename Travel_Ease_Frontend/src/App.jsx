import { useState } from "react";
import { Routes, Route } from "react-router-dom";
import Map_Page from "./pages/Map_Page.jsx";
import "./App.css";

function App() {
  const [count, setCount] = useState(0);

  return (
    <main>
      <Routes>
        <Route path="/map" element={<Map_Page />} />
      </Routes>
    </main>
  );
}

export default App;
