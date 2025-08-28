// src/pages/SalesLayout.jsx
import { PlanetIcon, MoonIcon, SparklesIcon } from "../components/CelestialIcons";

import { NavLink, Outlet } from "react-router-dom";
import { useEffect, useState } from "react";

export default function SalesLayout() {
  const [open, setOpen] = useState(false);

  // Close drawer on ESC
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // NavLink class helper (matches your .menu-link CSS and adds .is-active)
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

      {/* Drawer + Backdrop */}
      {open && <div className="backdrop" onClick={() => setOpen(false)} />}
      <aside className={`drawer ${open ? "open" : ""}`} aria-hidden={!open}>
        <div className="drawer-header">
          <div className="drawer-title">Navigation</div>
          <button className="close" onClick={() => setOpen(false)} aria-label="Close menu">
            ×
          </button>
        </div>

        <ul className="menu">
  <li>
    <NavLink to="/sales/ringup" end className={linkClass} onClick={() => setOpen(false)}>
      <PlanetIcon className="icon-20" />
      <span>Ring Up</span>
    </NavLink>
  </li>
  <li>
    <NavLink to="/sales/snapshot" className={linkClass} onClick={() => setOpen(false)}>
      <MoonIcon className="icon-20" />
      <span>Snapshot</span>
    </NavLink>
  </li>
  <li>
    <NavLink to="/sales/catalog" className={linkClass} onClick={() => setOpen(false)}>
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



