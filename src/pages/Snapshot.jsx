// src/pages/Snapshot.jsx
import { useMemo, useState, useEffect } from "react";
import useSales from "../state/useSales";

export default function Snapshot() {
  const { sales = [], eventStart, eventName } = useSales();

  // If there's an active event, default to "event", else "today"
  const [range, setRange] = useState(eventStart ? "event" : "today");
  useEffect(() => {
    if (eventStart) setRange("event");
    else setRange("today");
  }, [eventStart]);

  // Filtered sales for the current range
  const scoped = useMemo(
    () => filterByRange(sales, range, eventStart),
    [sales, range, eventStart]
  );

  const { orders, gross, items, aov } = useMemo(() => kpis(scoped), [scoped]);
  const topPatterns = useMemo(() => topBy(scoped, "pattern", 3), [scoped]);
  const recent = useMemo(
    () => [...scoped].sort((a, b) => b.timestamp - a.timestamp).slice(0, 5),
    [scoped]
  );

  return (
    <div className="wrap">
      <h1>Booth Babe – Snapshot</h1>

      {/* Range selector */}
      <section className="card">
        <div className="toolbar">
          <h2>
            Range {eventName && range === "event" && `– ${eventName}`}
          </h2>
          <div className="toolbar-actions">
            {["today", "event", "7d"].map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={`chip ${range === r ? "is-active" : ""}`}
                disabled={r === "event" && !eventStart}
              >
                {r === "7d"
                  ? "Last 7 Days"
                  : r === "event"
                  ? "Current Event"
                  : "Today"}
              </button>
            ))}
          </div>
        </div>
        <p className="muted">
          {range === "event" && eventName
            ? `Showing sales since this event started (${new Date(
                eventStart
              ).toLocaleString()}).`
            : range === "today"
            ? "Showing only today's sales."
            : "Showing the last 7 days of sales."}
        </p>
      </section>

      {/* KPIs */}
      <section className="card">
        <div className="kpi-grid">
          <Kpi label="Gross Sales" value={`$${gross.toFixed(2)}`} />
          <Kpi label="Orders" value={orders} />
          <Kpi label="Items Sold" value={items} />
          <Kpi label="Avg Order" value={`$${aov.toFixed(2)}`} />
        </div>
      </section>

      {/* Top Patterns */}
      <Card title="Top Patterns">
        <ListPairs rows={topPatterns} rightIsNumber />
      </Card>

      {/* Recent Orders */}
      <Card title="Recent Orders">
        {recent.length === 0 ? (
          <p className="muted">No orders in this range yet.</p>
        ) : (
          <ul className="list-divided">
            {recent.map((o) => (
              <li key={o.id} className="row-between">
                <span className="tabular-nums">
                  {new Date(o.timestamp).toLocaleTimeString()}
                </span>
                <span className="muted">
                  {(o.items || []).reduce((a, i) => a + (i.qty || 0), 0)} items
                </span>
                <span className="font-strong tabular-nums">
                  ${Number(o.total || 0).toFixed(2)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

/* ---------- helpers ---------- */
function isToday(ts) {
  const d = new Date(ts);
  const now = new Date();
  return d.toDateString() === now.toDateString();
}

function filterByRange(sales, range, eventStart) {
  const now = Date.now();
  if (range === "today") return sales.filter((s) => isToday(s.timestamp));
  if (range === "7d")
    return sales.filter((s) => s.timestamp >= now - 7 * 24 * 60 * 60 * 1000);
  if (range === "event" && eventStart != null)
    return sales.filter((s) => s.timestamp >= eventStart);
  return sales;
}

function kpis(sales) {
  const orders = sales.length;
  const gross = sales.reduce((a, s) => a + (s.total || 0), 0);
  const items = sales.reduce(
    (a, s) => a + (s.items || []).reduce((x, i) => x + (i.qty || 0), 0),
    0
  );
  const aov = orders ? gross / orders : 0;
  return { orders, gross, items, aov };
}

function topBy(sales, key, n) {
  const tally = {};
  for (const s of sales) {
    for (const i of s.items || []) {
      const k = i[key] ?? "—";
      tally[k] = (tally[k] || 0) + (i.qty || 0);
    }
  }
  return Object.entries(tally).sort((a, b) => b[1] - a[1]).slice(0, n);
}

/* ---------- tiny UI bits ---------- */
function Kpi({ label, value }) {
  return (
    <div className="kpi">
      <div className="kpi-label">{label}</div>
      <div className="kpi-value">{value}</div>
    </div>
  );
}
function Card({ title, children }) {
  return (
    <section className="card">
      <div className="toolbar">
        <h3>{title}</h3>
      </div>
      {children}
    </section>
  );
}
function ListPairs({ rows, rightIsNumber }) {
  return (
    <ul className="text-sm space-y-1">
      {rows.map(([k, v]) => (
        <li key={k} className="flex-between">
          <span className="truncate">{k}</span>
          <span className={rightIsNumber ? "tabular-nums" : ""}>{v}</span>
        </li>
      ))}
    </ul>
  );
}
