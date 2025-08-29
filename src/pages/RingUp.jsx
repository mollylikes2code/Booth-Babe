// src/pages/RingUp.jsx
import React, { useEffect, useMemo, useState } from "react";
import useSales from "../state/useSales";
import useCatalog from "../state/useCatalog";

const SHEETS_ENDPOINT = import.meta.env.VITE_SHEETS_ENDPOINT;
const SHEETS_SECRET   = import.meta.env.VITE_SHEETS_SECRET;

export default function RingUp() {
  // ----- Persisted rows for the "current order"
  const [rows, setRows] = useState(() => {
    try {
      const saved = localStorage.getItem("bb_rows");
      return saved ? JSON.parse(saved) : [];
    } catch (err) {
      console.warn("bb_rows parse failed; starting empty.", err);
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

  // ----- Shared sales + event state
  const { sales, appendSale, eventName, startEvent, endEvent } = useSales();

  // ----- Live catalog (item types + fabrics)
  const { itemTypes, fabricOptions } = useCatalog();

  // safe defaults
  const firstType = itemTypes?.[0]?.type || "";
  const firstFabricId = fabricOptions?.[0]?.id || "";

  // ----- Form state
  const [productType, setProductType] = useState(firstType);
  const [fabricId, setFabricId]       = useState(firstFabricId);
  const [priceOverride, setPriceOverride] = useState("");
  const [qty, setQty] = useState(1);
  const [notes, setNotes] = useState("");

  // keep defaults in sync if catalog changes
  useEffect(() => {
    if (!productType && firstType) setProductType(firstType);
  }, [firstType, productType]);

  useEffect(() => {
    if (!fabricId && firstFabricId) setFabricId(firstFabricId);
  }, [firstFabricId, fabricId]);

  const defaultPrice = useMemo(() => {
    const found = (itemTypes || []).find((p) => p.type === productType);
    return Number(found?.defaultPrice ?? 0);
  }, [productType, itemTypes]);

  const priceToUse = priceOverride === "" ? defaultPrice : Number(priceOverride || 0);

  // ----- Helpers
  function addRow(e) {
    e.preventDefault();
    const fab = (fabricOptions || []).find(f => f.id === fabricId);
    if (!productType || !fab) return;

    setRows((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        productType,
        series: fab.series,   // store both for Snapshot
        pattern: fab.pattern,
        price: Number(priceToUse) || 0,
        qty: Number(qty) || 0,
        notes: notes.trim(),
      },
    ]);
    setFabricId(firstFabricId || "");
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

  function clearTable() {
    if (rows.length === 0) return;
    const ok = window.confirm("Clear the current order? This cannot be undone.");
    if (ok) setRows([]);
  }

  function genOrderNumber(nextIndex) {
    const d = new Date();
    const ymd =
      d.getFullYear().toString() +
      String(d.getMonth() + 1).padStart(2, "0") +
      String(d.getDate()).padStart(2, "0");
    return `BB-${ymd}-${String(nextIndex).padStart(3, "0")}`;
  }

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
        sku: r.id,
        name: r.productType,
        qty: Number(r.qty) || 0,
        price: Number(r.price) || 0,
        series: r.series,
        pattern: r.pattern,
      })),
      subtotal: Number(subtotal) || 0,
      tax: 0,
      total: Number(subtotal) || 0,
      paymentMethod: "other",
      notes: "",
    };

    appendSale(sale);
    setRows([]);

    try {
      const res = await fetch(SHEETS_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          secret: SHEETS_SECRET,
          timestamp: sale.timestampIso,
          orderNumber: sale.orderNumber,
          subtotal: sale.subtotal,
          eventName,                 // include active event ("" if none)
          items: sale.items,
          notes: sale.notes,
        }),
      });

      let ok = true;
      let respText = "";
      try {
        respText = await res.text();      // read as text first
        try {
          const data = JSON.parse(respText);
          ok = data?.ok === true;
        } catch {
          ok = res.ok;                   // non-JSON – fall back to HTTP status
        }
      } catch (err) {
        ok = false;
        respText = String(err);
      }

      alert(
        ok
          ? `Sale recorded & sync sent: ${sale.orderNumber}`
          : `Sale recorded locally. Sync might have failed.\n\nServer reply:\n${respText}`
      );
    } catch (err) {
      console.error("Sync failed:", err);
      alert(`Sale recorded locally. Sync failed (network error).`);
    }

    // mirror to localStorage for Snapshot/other tabs
    try {
      const ls = JSON.parse(localStorage.getItem("bb_sales") || "[]");
      const updated = ls.concat(sale);
      localStorage.setItem("bb_sales", JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent("bb:sales-updated", { detail: { sales: updated } }));
    } catch (err) {
      console.warn("Failed to mirror sale to localStorage event.", err);
    }
  } // << properly closes recordSale()

  return (
    <div className="min-h-screen text-white">
      <div className="wrap">
        {/* ===== Toolbar / Header ===== */}
        <header className="toolbar">
          <div className="toolbar-left">
            <h2>Ring Up</h2>
          </div>

          <div className="toolbar-actions">
            {eventName ? (
              <button
                className="secondary"
                onClick={() => {
                  if (confirm(`End event "${eventName}" now?`)) endEvent();
                }}
                title="End the active event"
              >
                End Event ({eventName})
              </button>
            ) : (
              <button
                className="primary"
                onClick={() => {
                  const suggestion = new Date().toLocaleDateString(undefined, {
                    year: "numeric",
                    month: "short",
                    day: "2-digit",
                  });
                  const name = prompt("Enter event name:", suggestion);
                  if (name && name.trim()) startEvent(name.trim());
                }}
                title="Start a new event"
              >
                Start New Event
              </button>
            )}
          </div>
        </header>

        <h1>Booth Babe – Inventory</h1>

        <form className="card" onSubmit={addRow}>
          <div className="row">
            <label>Item Type</label>
            <select value={productType} onChange={(e) => setProductType(e.target.value)}>
              {(itemTypes || []).length ? (
                itemTypes.map((p) => (
                  <option key={p.type} value={p.type}>{p.type}</option>
                ))
              ) : (
                <option value="">No item types yet — add some in Catalog</option>
              )}
            </select>
          </div>

          <div className="row">
            <label>Fabric</label>
            <select value={fabricId} onChange={(e) => setFabricId(e.target.value)}>
              {(fabricOptions || []).length ? (
                fabricOptions.map((f) => (
                  <option key={f.id} value={f.id}>{f.label}</option> // "Series — Pattern"
                ))
              ) : (
                <option value="">No fabrics yet — add some in Catalog</option>
              )}
            </select>
          </div>

          <div className="row">
            <label>Price</label>
            <div className="inline">
              <input
                type="number"
                step="0.01"
                placeholder={`Default $${defaultPrice}`}
                value={priceOverride}
                onChange={(e) => setPriceOverride(e.target.value)}
              />
              <span className="help">Leave blank to use default</span>
            </div>
          </div>

          <div className="row">
            <label>Quantity</label>
            <input type="number" min="0" value={qty} onChange={(e) => setQty(e.target.value)} />
          </div>

          <div className="row">
            <label>Notes</label>
            <input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="fabric, variant, etc." />
          </div>

          <button className="primary">Add to List</button>
        </form>

        <div className="card">
          <div className="toolbar">
            <h2>Current Order</h2>
            <div className="toolbar-actions">
              <button className="secondary" onClick={clearTable}>Clear Table</button>
              <button className="success" onClick={recordSale}>Record Sale</button>
            </div>
          </div>

          {rows.length === 0 ? (
            <p className="muted">No items yet — add something above 👆</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Fabric</th>
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
                    <td>{r.series} — {r.pattern}</td>
                    <td>${Number(r.price).toFixed(2)}</td>
                    <td>{r.qty}</td>
                    <td>${(Number(r.price) * Number(r.qty)).toFixed(2)}</td>
                    <td>
                      <button className="danger" onClick={() => removeRow(r.id)}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan="4" style={{ textAlign: "right", fontWeight: 700 }}>Subtotal</td>
                  <td colSpan="2" style={{ fontWeight: 700 }}>${subtotal.toFixed(2)}</td>
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
