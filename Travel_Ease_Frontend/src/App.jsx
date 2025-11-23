import { useState, useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import Main_Map_Page from "./component/map_components/Main_Map_Page.jsx";
import Main_Landing_Page from "./pages/Main_Landing_Page.jsx";
import Main_Page from "./pages/Main_Page.jsx";
import Main_Travel_Spots_Page from "./pages/Travel_Spots/Main_Travel_Spots.jsx";
import Planner from "./pages/Planner.jsx";
import "./App.css";
import Landing_Page from "./pages/Landing_Page.";
import Business_Page from "./pages/Business_Page";

function App() {
  return (
    <main>
      <Routes>
        <Route path="/business_landing_page" element={<Landing_Page />} />
        <Route path="/business/:id" element={<Business_Page />} />
        <Route />
        <Route path="/" element={<Main_Page />} />
        <Route path="/planner/:status/:id" element={<Planner />} />
        <Route path="/map" element={<Main_Map_Page />} />
        <Route path="/map/div" element={<Main_Landing_Page />} />
        <Route path="/travel_spots_page" element={<Main_Travel_Spots_Page />} />
      </Routes>
    </main>
  );
}

export default App;
