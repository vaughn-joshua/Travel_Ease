import { useState } from "react";
import { Routes, Route } from "react-router-dom";
import Map_Page from "./map_components/Map_Page.jsx";
import "./App.css";

function App() {
  const [count, setCount] = useState(0);

  return (
    <>
      <Map_Page />
    </>
  );
}

export default App;
