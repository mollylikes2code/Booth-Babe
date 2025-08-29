// src/pages/SalesLayout.jsx
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { PlanetIcon, MoonIcon, SparklesIcon } from "../components/CelestialIcons";

export default function SalesLayout() {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  // Close drawer on ESC
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Close drawer after navigation
  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  // Matches your .menu-link /.is-active styles
  const linkClass = ({ isActive }) => "menu-link" + (isActive ? " is-active" : "");

  return (
    <div className="layout">
      {/* Top header */}
      <header className="topbar">
        <button
          className={`hamburger ${open ? "is-open" : ""}`}
          aria-label="Open navigation menu"
          aria-expanded={open}
          onClick={() => setOpen(true)}
        >
          <span />
          <span />
          <span />
        </button>

        <h1 className="brand">Booth Babe</h1>
        <div className="spacer" />
      </header>

      {/* Backdrop + Drawer */}
      {open && <div className="backdrop" onClick={() => setOpen(false)} aria-hidden />}
      <aside className={`drawer ${open ? "open" : ""}`} aria-hidden={!open}>
        <div className="drawer-header">
          <div className="drawer-title">Navigation</div>
          <button className="close" onClick={() => setOpen(false)} aria-label="Close menu">
            ×
          </button>
        </div>

        <ul className="menu">
          <li>
            <NavLink to="/sales/ringup" end className={linkClass}>
              <PlanetIcon className="icon-20" />
              <span>Ring Up</span>
            </NavLink>
          </li>
          <li>
            <NavLink to="/sales/snapshot" className={linkClass}>
              <MoonIcon className="icon-20" />
              <span>Snapshot</span>
            </NavLink>
          </li>
          <li>
            <NavLink to="/sales/catalog" className={linkClass}>
              <SparklesIcon className="icon-20" />
              <span>Catalog</span>
            </NavLink>
          </li>
        </ul>
      </aside>

      {/* Page content */}
      <main className="content">
        <div className="wrap content-box">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
