import { Routes, Route } from "react-router-dom";
import reactLogo from "./assets/react.svg";
import viteLogo from "/vite.svg";
import "./App.css";
import Login from "./pages/Login.jsx";

function App() {
  return (
    <main>
      <Routes>
        <Route />
        <Route path="/login" element={<Login />} />
      </Routes>
    </main>
  );
}

export default App;
