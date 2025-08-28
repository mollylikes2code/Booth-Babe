// src/pages/Dashboard.jsx
import { Link } from "react-router-dom";
import StarsOverlay from "../components/StarsOverlay";

export default function Dashboard() {
  const Card = ({ to, title, caption }) => (
    <Link
      to={to}
      className="
        group rounded-3xl p-6 bg-white/5 border border-white/10
        hover:bg-white/10 hover:border-white/20
        transition-transform duration-150 hover:-translate-y-0.5
        shadow-xl ring-1 ring-white/5
        flex flex-col gap-2
      "
    >
      <div className="text-lg font-semibold">{title}</div>
      <div className="text-sm opacity-75">{caption}</div>
    </Link>
  );

  return (
    <div className="min-h-screen text-white">
      <StarsOverlay />
      <div className="wrap">
        <h1 style={{ marginBottom: 12 }}>Booth Babe</h1>
        <p className="muted" style={{ marginBottom: 16 }}>
          Choose a workspace to get started.
        </p>

        <div className="grid gap-4 md:grid-cols-3">
          <Card to="/sales/ringup" title="Sales" caption="Ring up & view sales" />
          <Card to="/products" title="Products" caption="Manage items" />
          <Card to="/reports" title="Reports" caption="Trends & insights" />
        </div>
      </div>
    </div>
  );
}
