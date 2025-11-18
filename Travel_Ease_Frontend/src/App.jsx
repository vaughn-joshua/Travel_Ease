import { Routes, Route } from "react-router-dom";
import "./App.css";
import Main_Page from "./pages/Main_Page.jsx";
import Planner from "./pages/Planner.jsx";

function App() {
  return (
    <main>
      <Routes>
        <Route path="/" element={<Main_Page />} />
        <Route path="/planner/:status/:id" element={<Planner />} />
      </Routes>
    </main>
  );
}

export default App;
