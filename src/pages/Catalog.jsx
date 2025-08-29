// src/pages/Catalog.jsx
import React, { useState } from "react";
import useCatalog from "../state/useCatalog";

export default function Catalog() {
  const {
    series,
    fabricsBySeries,
    addFabric,
    removeFabric,
    itemTypes,
    addItemType,
    removeItemType,
  } = useCatalog();

  const [mode, setMode] = useState(null); // "fabric" | "item" | null

  // Fabric form state
  const [fabricSeries, setFabricSeries] = useState("");
  const [fabricPattern, setFabricPattern] = useState("");

  // Item Type form state
  const [itType, setItType] = useState("");
  const [itPrice, setItPrice] = useState("");
  const [itNotes, setItNotes] = useState("");

  function submitFabric(e) {
    e.preventDefault();
    addFabric({ series: fabricSeries || "Miscellaneous", pattern: fabricPattern });
    setFabricPattern("");
  }

  function submitItemType(e) {
    e.preventDefault();
    addItemType({ type: itType, defaultPrice: itPrice, notes: itNotes });
    setItType("");
    setItPrice("");
    setItNotes("");
  }

  return (
    <div className="grid gap-4">
      {/* Right-aligned buttons */}
      <div className="actions-right">
        <button className="primary" onClick={() => setMode("fabric")}>[ + ] Add New Fabric</button>
        <button className="primary" onClick={() => setMode("item")}>[ + ] Add New Item Type</button>
      </div>

      {mode === "fabric" && (
        <form className="card" onSubmit={submitFabric}>
          <div className="toolbar">
            <h2>Add New Fabric</h2>
            <button type="button" className="secondary" onClick={() => setMode(null)}>Close</button>
          </div>

          <div className="row">
            <label>Series</label>
            <input
              list="series-list"
              placeholder="e.g., Core, Holiday… (defaults to Miscellaneous)"
              value={fabricSeries}
              onChange={(e) => setFabricSeries(e.target.value)}
            />
            <datalist id="series-list">
              {series.map(s => <option key={s} value={s} />)}
            </datalist>
          </div>

          <div className="row">
            <label>Pattern</label>
            <input
              placeholder="Name Cat recognizes (e.g., Twilight Sparkle Tie-dye)"
              value={fabricPattern}
              onChange={(e) => setFabricPattern(e.target.value)}
              required
            />
          </div>

          <button className="success">Save Fabric</button>
        </form>
      )}

      {mode === "item" && (
        <form className="card" onSubmit={submitItemType}>
          <div className="toolbar">
            <h2>Add New Item Type</h2>
            <button type="button" className="secondary" onClick={() => setMode(null)}>Close</button>
          </div>

          <div className="row">
            <label>Item Type</label>
            <input
              placeholder="e.g., Bucket Hat, Keychain, Scrunchie"
              value={itType}
              onChange={(e) => setItType(e.target.value)}
              required
            />
          </div>

          <div className="row">
            <label>Default Price</label>
            <input
              type="number"
              step="0.01"
              placeholder="e.g., 10.00"
              value={itPrice}
              onChange={(e) => setItPrice(e.target.value)}
            />
          </div>

          <div className="row">
            <label>Notes</label>
            <input
              placeholder="Where fabric was bought, order #, etc."
              value={itNotes}
              onChange={(e) => setItNotes(e.target.value)}
            />
          </div>

          <button className="success">Save Item Type</button>
        </form>
      )}

      {/* Fabrics grouped by Series — 3 across grid */}
      <div className="card">
        <div className="toolbar">
          <h2>Fabrics by Series</h2>
        </div>

        {fabricsBySeries.length === 0 ? (
          <p className="muted">No fabrics yet — add your first one with “Add New Fabric”.</p>
        ) : (
          <div className="grid-3">
            {fabricsBySeries.map(([seriesName, list]) => (
              <div key={seriesName} className="rounded-2xl p-4 bg-white/5 border border-white/10">
                <div className="text-sm font-medium mb-2">{seriesName}</div>
                <ul className="text-sm divide-y divide-white/10">
                  {list.map(f => (
                    <li key={f.id} className="py-2 flex items-center justify-between gap-3">
                      <span>{f.pattern}</span>
                      <button className="danger" onClick={() => removeFabric(f.id)}>Delete</button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Item types list (quick view) */}
      <div className="card">
        <div className="toolbar">
          <h2>Item Types</h2>
        </div>
        {itemTypes.length === 0 ? (
          <p className="muted">No item types yet — add one above.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Item Type</th>
                <th>Default Price</th>
                <th>Notes</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {itemTypes.map(it => (
                <tr key={it.type}>
                  <td>{it.type}</td>
                  <td>${Number(it.defaultPrice || 0).toFixed(2)}</td>
                  <td>{it.notes || ""}</td>
                  <td><button className="danger" onClick={() => removeItemType(it.type)}>Delete</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
