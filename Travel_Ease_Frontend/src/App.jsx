import { Routes, Route } from "react-router-dom";
import Main_Page from "./pages/Main_Page.jsx";

import "./App.css";

function App() {
  return (
    <main>
      <Routes>
        <Route path="/" element={<Main_Page />} />
        <Route />
      </Routes>
    </main>
  );
}

export default App;
