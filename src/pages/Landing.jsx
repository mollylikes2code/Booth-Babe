// src/pages/Landing.jsx
import { Link } from "react-router-dom";

import moonImg   from "../components/icon_moon.png";
import planetImg from "../components/icon_planet.png";
import starsImg  from "../components/icon_stars.png";

export default function Landing() {
  const tiles = [
    { to: "/sales/ringup",   img: moonImg,   label: "Ring Up" },
    { to: "/sales/snapshot", img: planetImg, label: "Snapshot" },
    { to: "/sales/catalog",  img: starsImg,  label: "Catalog" },
  ];

  return (
    <div className="min-h-screen text-white">
      <div className="wrap">
        <header className="card card-gradient" style={{ textAlign: "center" }}>
          <h1 className="landing-title">Welcome to Booth Babe</h1>
          <p className="muted">Choose where you’d like to go:</p>
        </header>

        <div
          className="grid"
          style={{ gap: 20, marginTop: 24, gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}
        >
          {tiles.map(({ to, img, label }) => (
            <Link key={to} to={to} className="card card-gradient" style={{ textAlign: "center" }}>
              <img src={img} alt={label} className="mx-auto mb-3 h-16 w-16" />
              <span className="text-lg font-semibold">{label}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
