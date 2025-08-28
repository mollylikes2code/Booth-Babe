// src/pages/RingUp.jsx
import React, { useEffect, useMemo, useState } from "react";
import useCatalog from "../state/useCatalog";
import useSales from "../state/useSales";

const SHEETS_ENDPOINT = import.meta.env.VITE_SHEETS_ENDPOINT;
const SHEETS_SECRET   = import.meta.env.VITE_SHEETS_SECRET;

export default function RingUp() {
  // ----- Persisted rows for the "current order"
  const [rows, setRows] = useState(() => {
    try {
      const saved = localStorage.getItem("bb_rows");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem("bb_rows", JSON.stringify(rows));
    } catch (err) {
      console.error("Failed to write bb_rows:", err);
    }
  }, [rows]);

  // ----- Catalog + Sales state
  const { types, patterns } = useCatalog();
  const {
    sales,
    appendSale,
    eventName,
    startEvent,
    endEvent,
  } = useSales();

  // ----- Form state (init from current catalog)
  const [productType, setProductType] = useState(() => types[0]?.type ?? "");
  const [pattern, setPattern]         = useState(() => patterns[0] ?? "");
  const [priceOverride, setPriceOverride] = useState("");
  const [qty, setQty] = useState(1);
  const [notes, setNotes] = useState("");

  // Keep selections valid if catalog changes
  useEffect(() => {
    if (!types.find((t) => t.type === productType)) {
      setProductType(types[0]?.type ?? "");
    }
  }, [types, productType]);
  useEffect(() => {
    if (!patterns.includes(pattern)) {
      setPattern(patterns[0] ?? "");
    }
  }, [patterns, pattern]);

  // Default price comes from selected type
  const defaultPrice = useMemo(() => {
    const found = types.find((p) => p.type === productType);
    return found?.defaultPrice ?? 0;
  }, [types, productType]);

  const priceToUse = priceOverride === "" ? defaultPrice : Number(priceOverride) || 0;

  // ----- Helpers
  function addRow(e) {
    e.preventDefault();
    if (!productType || !pattern) return;
    setRows((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        productType,
        pattern,
        price: Number(priceToUse) || 0,
        qty: Number(qty) || 0,
        notes: notes.trim(),
      },
    ]);
    setPattern(patterns[0] ?? "");
    setPriceOverride("");
    setQty(1);
    setNotes("");
  }

  function removeRow(id) {
    setRows((prev) => prev.filter((r) => r.id !== id));
  }

  const subtotal = rows.reduce(
    (sum, r) => sum + (Number(r.price) || 0) * (Number(r.qty) || 0),
    0
  );

  // ----- Clear the current order
  function clearTable() {
    if (rows.length === 0) return;
    const ok = window.confirm("Clear the current order? This cannot be undone.");
    if (ok) setRows([]);
  }

  // ----- Generate order number
  function genOrderNumber(nextIndex) {
    const d = new Date();
    const ymd =
      d.getFullYear().toString() +
      String(d.getMonth() + 1).padStart(2, "0") +
      String(d.getDate()).padStart(2, "0");
    return `BB-${ymd}-${String(nextIndex).padStart(3, "0")}`;
  }

  // ----- Record sale (local shared state + send to Sheets)
  async function recordSale() {
    if (rows.length === 0) {
      alert("No items in the order to record.");
      return;
    }

    const nextIndex = sales.length + 1;
    const sale = {
      id: crypto.randomUUID(),
      orderNumber: genOrderNumber(nextIndex),
      timestamp: Date.now(),
      timestampIso: new Date().toISOString(),
      items: rows.map((r) => ({
        sku: r.id, // placeholder SKU
        name: r.productType,
        qty: Number(r.qty) || 0,
        price: Number(r.price) || 0,
        pattern: r.pattern,
      })),
      subtotal: Number(subtotal) || 0,
      tax: 0,
      total: Number(subtotal) || 0,
      paymentMethod: "other",
      notes: "",
      // Tag with active event (the hook also tags, this is to include in outbound payload too)
      event: eventName || null,
    };

    // 1) Save to shared sales (updates Snapshot instantly)
    appendSale(sale);

    // 2) Clear current order UI
    setRows([]);

    // 3) Send to Google Sheets (optional)
    try {
      const res = await fetch(SHEETS_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({
          secret: SHEETS_SECRET,
          timestamp: sale.timestampIso,
          orderNumber: sale.orderNumber,
          subtotal: sale.subtotal,
          items: sale.items,
          notes: sale.notes,
          event: sale.event,
        }),
      });

      let ok = true;
      try {
        const data = await res.json();
        ok = data?.ok === true;
      } catch {
        // some GAS deployments don't return JSON
      }

      alert(
        ok
          ? `Sale recorded & sync sent: ${sale.orderNumber}`
          : `Sale recorded locally. Sync might have failed.`
      );
    } catch (err) {
      console.error("Sync failed:", err);
      alert(`Sale recorded locally. Sync failed (network error).`);
    }
  }

  const noTypes = types.length === 0;
  const noPatterns = patterns.length === 0;

  return (
    <div className="min-h-screen text-white">
      <div className="wrap">
        <h1>Booth Babe – Inventory</h1>

        {/* Optional: Event controls card */}
        <section className="card" style={{ marginTop: 16 }}>
          <div className="toolbar">
            <h2>Event</h2>
            <div className="toolbar-actions">
              {eventName ? (
                <>
                  <span className="chip is-active">Active: {eventName}</span>
                  <button className="secondary" onClick={endEvent}>
                    End Event
                  </button>
                </>
              ) : (
                <button
                  className="primary"
                  onClick={() => {
                    const name = prompt("Enter event name:");
                    if (name) startEvent(name);
                  }}
                >
                  Start Event
                </button>
              )}
            </div>
          </div>
          <p className="muted">
            Start an event to tag all new sales. You can end it anytime.
          </p>
        </section>

        <form className="card" onSubmit={addRow}>
          <div className="row">
            <label>Product Type</label>
            <select
              value={productType}
              onChange={(e) => setProductType(e.target.value)}
              disabled={noTypes}
            >
              {noTypes ? (
                <option value="">Add a type in Catalog</option>
              ) : (
                types.map((p) => (
                  <option key={p.type} value={p.type}>
                    {p.type}
                  </option>
                ))
              )}
            </select>
          </div>

          <div className="row">
            <label>Pattern</label>
            <select
              value={pattern}
              onChange={(e) => setPattern(e.target.value)}
              disabled={noPatterns}
            >
              {noPatterns ? (
                <option value="">Add a pattern in Catalog</option>
              ) : (
                patterns.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))
              )}
            </select>
          </div>

          <div className="row">
            <label>Price</label>
            <div className="inline">
              <input
                type="number"
                step="0.01"
                placeholder={`Default $${(defaultPrice || 0).toFixed(2)}`}
                value={priceOverride}
                onChange={(e) => setPriceOverride(e.target.value)}
              />
              <span className="help">Leave blank to use default</span>
            </div>
          </div>

          <div className="row">
            <label>Quantity</label>
            <input
              type="number"
              min="0"
              value={qty}
              onChange={(e) => setQty(e.target.value)}
            />
          </div>

          <div className="row">
            <label>Notes</label>
            <input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="fabric, variant, etc."
            />
          </div>

          <button className="primary" disabled={noTypes || noPatterns}>
            Add to List
          </button>
        </form>

        <div className="card">
          <div className="toolbar">
            <h2>Current Order</h2>
            <div className="toolbar-actions">
              <button className="secondary" onClick={clearTable}>
                Clear Table
              </button>
              <button className="success" onClick={recordSale}>
                Record Sale
              </button>
            </div>
          </div>

          {rows.length === 0 ? (
            <p className="muted">No items yet — add something above 👆</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Pattern</th>
                  <th>Price</th>
                  <th>Qty</th>
                  <th>Total</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id}>
                    <td>{r.productType}</td>
                    <td>{r.pattern}</td>
                    <td>${Number(r.price).toFixed(2)}</td>
                    <td>{r.qty}</td>
                    <td>${(Number(r.price) * Number(r.qty)).toFixed(2)}</td>
                    <td>
                      <button className="danger" onClick={() => removeRow(r.id)}>
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan="4" style={{ textAlign: "right", fontWeight: 700 }}>
                    Subtotal
                  </td>
                  <td colSpan="2" style={{ fontWeight: 700 }}>
                    ${subtotal.toFixed(2)}
                  </td>
                </tr>
              </tfoot>
            </table>
          )}

          <p className="muted" style={{ marginTop: 12 }}>
            Sales recorded: <strong>{sales.length}</strong>
          </p>
        </div>
      </div>
    </div>
  );
}
