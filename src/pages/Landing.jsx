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
    <div className="wrap">
      <div className="landing-box">
        <h1 className="landing-title">Welcome to Booth Babe</h1>
        <p className="landing-sub">Choose where you’d like to go:</p>

        <div className="landing-grid">
          {tiles.map(({ to, img, label }) => (
            <Link key={to} to={to} className="landing-tile">
              <img src={img} alt={label} className="landing-img" />
              <span className="landing-label">{label}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
