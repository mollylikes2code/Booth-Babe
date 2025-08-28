// src/routes.jsx
import { Navigate, Route, Routes } from "react-router-dom";
import React from "react";
import SalesLayout from "./pages/SalesLayout";

const Landing        = React.lazy(() => import("./pages/Landing"));
const RingUp         = React.lazy(() => import("./pages/RingUp"));
const Snapshot       = React.lazy(() => import("./pages/Snapshot"));
const Catalog = React.lazy(() => import("./pages/Catalog"));
export default function AppRoutes() {
  return (
    <React.Suspense fallback={<div className="p-4">Loading…</div>}>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/sales" element={<SalesLayout />}>
          <Route index element={<Navigate to="ringup" replace />} />
          <Route path="ringup" element={<RingUp />} />
          <Route path="snapshot" element={<Snapshot />} />
          <Route path="catalog" element={<Catalog />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </React.Suspense>
  );
}
