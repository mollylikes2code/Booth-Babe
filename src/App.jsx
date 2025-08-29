// src/App.jsx
import React from "react";
import { BrowserRouter } from "react-router-dom";
import StarsOverlay from "./components/StarsOverlay"; // or "./StarsOverlay" if that's where yours lives
import AppRoutes from "./routes.jsx";

export default function App() {
  return (
    <div className="min-h-screen text-white">
      <StarsOverlay />
      <BrowserRouter>
        <div className="wrap">
          <AppRoutes />
        </div>
      </BrowserRouter>
    </div>
  );
}
