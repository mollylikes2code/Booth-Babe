// src/pages/RingUp.jsx
import React, { useEffect, useMemo, useState } from "react";
import { PRODUCT_TYPES, PATTERNS as FALLBACK_PATTERNS } from "../data";
import useSales from "../state/useSales";

const SHEETS_ENDPOINT = import.meta.env.VITE_SHEETS_ENDPOINT;
const SHEETS_SECRET   = import.meta.env.VITE_SHEETS_SECRET;

const LS_SERIES = "bb_fabricSeries";

function readSeriesCatalog() {
  try {
    const arr = JSON.parse(localStorage.getItem(LS_SERIES) || "[]");
    // Expect [{id, name, fabrics:[{id,name}]}...]
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

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
    try { localStorage.setItem("bb_rows", JSON.stringify(rows)); } catch {/*ignore*/}
  }, [rows]);

  // ----- Live catalog from Catalog.jsx (updates instantly on changes)
  const [catalog, setCatalog] = useState(readSeriesCatalog());
  useEffect(() => {
    function reload() { setCatalog(readSeriesCatalog()); }
    window.addEventListener("storage", (e) => { if (e.key === LS_SERIES) reload(); });
    window.addEventListener("bb:fabrics-updated", reload);
    return () => {
      window.removeEventListener("storage", reload);
      window.removeEventListener("bb:fabrics-updated", reload);
    };
  }, []);

  // Flatten for a default selected option
  const firstOptionValue = useMemo(() => {
    if (catalog.length && catalog[0].fabrics?.length) {
      return `${catalog[0].id}::${catalog[0].fabrics[0].id}`;
    }
    // fallback to old static list if no catalog yet
    return `__fallback__::${FALLBACK_PATTERNS[0]}`;
  }, [catalog]);

  // ----- Sales state (shared via hook so Snapshot updates instantly)
  const { sales, appendSale } = useSales();

  // ----- Form state
  const [productType, setProductType] = useState(PRODUCT_TYPES[0].type);
  const [fabricSel, setFabricSel]     = useState(firstOptionValue);
  const [priceOverride, setPriceOverride] = useState("");
  const [qty, setQty] = useState(1);
  const [notes, setNotes] = useState("");

  // Keep fabric default in sync if catalog changes (first available)
  useEffect(() => {
    setFabricSel((prev) => prev ?? firstOptionValue);
  }, [firstOptionValue]);

  const defaultPrice = useMemo(() => {
    const found = PRODUCT_TYPES.find((p) => p.type === productType);
    return found?.defaultPrice ?? 0;
  }, [productType]);

  const priceToUse = priceOverride === "" ? defaultPrice : Number(priceOverride);

  /** Decode fabric selection into {seriesName, fabricName} */
  function decodeFabric(val) {
    if (!val) return { seriesName: "Miscellaneous", fabricName: "" };
    const [sid, fid] = String(val).split("::");
    if (sid === "__fallback__") {
      return { seriesName: "Miscellaneous", fabricName: fid || "" };
    }
    const s = catalog.find((x) => x.id === sid);
    const f = s?.fabrics?.find((x) => x.id === fid);
    return {
      seriesName: s?.name || "Miscellaneous",
      fabricName: f?.name || "",
    };
  }

  // ----- Helpers
  function addRow(e) {
    e.preventDefault();
    const { seriesName, fabricName } = decodeFabric(fabricSel);
    if (!productType || !fabricName) return;

    setRows((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        productType,
        series: seriesName,
        pattern: fabricName,
        price: Number(priceToUse) || 0,
        qty: Number(qty) || 0,
        notes: notes.trim(),
      },
    ]);
    // reset only qty/notes/price override; keep last fabric selected for speed
    setPriceOverride("");
    setQty(1);
    setNotes("");
  }

  function removeRow(id) {
    setRows((prev) => prev.filter((r) => r.id !== id));
  }

  const subtotal = rows.reduce((sum, r) => sum + (Number(r.price) || 0) * (Number(r.qty) || 0), 0);

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

  // ===== Record sale flow: Preview → Confirm/Edit =====
  const [showPreview, setShowPreview] = useState(false);
  const [pendingSale, setPendingSale] = useState(null);

  function openPreview() {
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
        sku: r.id,                    // placeholder; you can sub real SKU later
        name: r.productType,
        qty: Number(r.qty) || 0,
        price: Number(r.price) || 0,
        pattern: r.pattern,
        series: r.series,            // <-- keep series for Snapshot "Top Series"
      })),
      subtotal: Number(subtotal) || 0,
      tax: 0,
      total: Number(subtotal) || 0,
      paymentMethod: "other",
      notes: "",
    };
    setPendingSale(sale);
    setShowPreview(true);
  }

  async function confirmSale() {
    if (!pendingSale) return;

    // 1) Save to shared sales (updates Snapshot immediately)
    appendSale(pendingSale);

    // 2) Clear UI rows
    setRows([]);
    setShowPreview(false);

    // 3) Send to Google Sheets
    try {
      const res = await fetch(SHEETS_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({
          secret: SHEETS_SECRET,
          timestamp: pendingSale.timestampIso,
          orderNumber: pendingSale.orderNumber,
          subtotal: pendingSale.subtotal,
          items: pendingSale.items,
          notes: pendingSale.notes,
        }),
      });
      let ok = true;
      try { ok = (await res.json())?.ok === true; } catch {/*ignore*/}
      alert(
        ok
          ? `Sale recorded & sync sent: ${pendingSale.orderNumber}`
          : `Sale recorded locally. Sync might have failed.`
      );
    } catch (err) {
      console.error("Sync failed:", err);
      alert(`Sale recorded locally. Sync failed (network error).`);
    }

    // 4) Also mirror into LS for any legacy readers (optional)
    try {
      const ls = JSON.parse(localStorage.getItem("bb_sales") || "[]");
      localStorage.setItem("bb_sales", JSON.stringify(ls.concat(pendingSale)));
      window.dispatchEvent(new CustomEvent("bb:sales-updated", { detail: { sales: ls.concat(pendingSale) } }));
    } catch {/*ignore*/}
  }

  function editSale() {
    // Just close preview to edit current rows
    setShowPreview(false);
    setPendingSale(null);
  }

  return (
    <div className="min-h-screen text-white">
      <div className="wrap">
        <h1>Booth Babe – Ring Up</h1>

        <form className="card" onSubmit={addRow}>
          <div className="row">
            <label>Product Type</label>
            <select value={productType} onChange={(e) => setProductType(e.target.value)}>
              {PRODUCT_TYPES.map((p) => (
                <option key={p.type} value={p.type}>
                  {p.type}
                </option>
              ))}
            </select>
          </div>

          <div className="row">
            <label>Fabric</label>
            <select
              value={fabricSel}
              onChange={(e) => setFabricSel(e.target.value)}
            >
              {catalog.length ? (
                catalog.map((s) => (
                  <optgroup key={s.id} label={s.name}>
                    {(s.fabrics || []).map((f) => (
                      <option key={f.id} value={`${s.id}::${f.id}`}>
                        {f.name}
                      </option>
                    ))}
                  </optgroup>
                ))
              ) : (
                <optgroup label="Miscellaneous">
                  {FALLBACK_PATTERNS.map((p) => (
                    <option key={p} value={`__fallback__::${p}`}>{p}</option>
                  ))}
                </optgroup>
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
              <button className="success" onClick={openPreview}>Record Sale</button>
            </div>
          </div>

          {rows.length === 0 ? (
            <p className="muted">No items yet — add something above 👆</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Series</th>
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
                    <td>{r.series}</td>
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
                  <td colSpan="5" style={{ textAlign: "right", fontWeight: 700 }}>
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

      {/* Preview modal */}
      {showPreview && pendingSale && (
        <div className="modal-backdrop" onMouseDown={(e) => {
          if (e.target.classList.contains("modal-backdrop")) setShowPreview(false);
        }}>
          <div className="modal-card" role="dialog" aria-modal="true" style={{ maxWidth: 720 }}>
            <div className="modal-title">Sales Order Preview</div>

            <div className="rounded-2xl p-4 bg-white/5 border border-white/10">
              <div className="text-sm mb-2 opacity-80">
                <div><strong>Order #:</strong> {pendingSale.orderNumber}</div>
                <div><strong>Date:</strong> {new Date(pendingSale.timestamp).toLocaleString()}</div>
              </div>
              <table>
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>Series</th>
                    <th>Fabric</th>
                    <th>Qty</th>
                    <th>Price</th>
                    <th>Line Total</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingSale.items.map((i) => (
                    <tr key={i.sku}>
                      <td>{i.name}</td>
                      <td>{i.series || "—"}</td>
                      <td>{i.pattern}</td>
                      <td>{i.qty}</td>
                      <td>${Number(i.price).toFixed(2)}</td>
                      <td>${(Number(i.price) * Number(i.qty)).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan="5" style={{ textAlign: "right", fontWeight: 700 }}>Total</td>
                    <td style={{ fontWeight: 700 }}>${Number(pendingSale.total).toFixed(2)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <div className="modal-actions">
              <button className="secondary" onClick={editSale}>Edit</button>
              <button className="primary" onClick={confirmSale}>Confirm</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
