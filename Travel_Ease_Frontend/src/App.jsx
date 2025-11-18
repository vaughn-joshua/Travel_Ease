import { useState, useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import Main_Map_Page from "./components/map_components/Main_Map_Page.jsx";
import Main_Landing_Page from "./pages/Main_Landing_Page.jsx";
// import "./App.css";

function App() {


  return (
    <>
      {/* <Main_Map_Page /> */}
      <Main_Landing_Page />
    
    </>
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
