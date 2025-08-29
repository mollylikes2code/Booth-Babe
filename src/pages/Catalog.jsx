// src/pages/Catalog.jsx
import React, { useEffect, useMemo, useState } from "react";

/** ---------- Persistence ---------- */
const LS_KEY = "bb_fabricSeries";
/*
[
  { id, name: "Pokemon", fabrics: [ { id, name }, ... ] },
  ...
]
*/
const uid = () => crypto.randomUUID();
const sameName = (a, b) => a?.trim().toLowerCase() === b?.trim().toLowerCase();

function readLS() {
  try { return JSON.parse(localStorage.getItem(LS_KEY)) || []; }
  catch { return []; }
}
function writeLS(data) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(data)); } catch {/*ignore*/}
  // Let other tabs/components (RingUp) refresh immediately
  window.dispatchEvent(new CustomEvent("bb:fabrics-updated", { detail: { series: data } }));
}

/** ---------- Page ---------- */
export default function Catalog() {
  const [series, setSeries] = useState(() => {
    const existing = readLS();
    if (existing.length) return existing;

    // Seed examples (safe to delete later)
    const seed = [
      {
        id: uid(),
        name: "Pokemon",
        fabrics: [
          { id: uid(), name: "Eevee Friends" },
          { id: uid(), name: "Eevee Teacup" },
          { id: uid(), name: "Eevee Window" },
          { id: uid(), name: "LF Pokemon" },
          { id: uid(), name: "Sleepy Babies" },
        ],
      },
      {
        id: uid(),
        name: "Series B",
        fabrics: [
          { id: uid(), name: "Pattern A" },
          { id: uid(), name: "Pattern B" },
          { id: uid(), name: "Pattern C" },
          { id: uid(), name: "Pattern D" },
          { id: uid(), name: "Pattern E" },
        ],
      },
    ];
    writeLS(seed);
    return seed;
  });

  useEffect(() => writeLS(series), [series]);

  // Modal state for “Add New Fabric”
  const [showAdd, setShowAdd] = useState(false);

  function handleAddFabric({ seriesName, fabricName }) {
    const cleanSeries = seriesName?.trim() || "Miscellaneous";
    const cleanFabric = fabricName.trim();

    setSeries(prev => {
      // find series by case-insensitive name
      const idx = prev.findIndex(s => sameName(s.name, cleanSeries));
      if (idx >= 0) {
        // add to existing series
        const next = [...prev];
        next[idx] = {
          ...next[idx],
          fabrics: next[idx].fabrics.concat({ id: uid(), name: cleanFabric }),
        };
        return next;
      } else {
        // create new series with first fabric
        return prev.concat({
          id: uid(),
          name: cleanSeries,
          fabrics: [{ id: uid(), name: cleanFabric }],
        });
      }
    });
  }

  return (
    <div className="wrap text-white">
      <div className="card">
        <div className="toolbar">
          <h2>Fabrics by Series</h2>
          <div className="toolbar-actions">
            <button className="primary" onClick={() => setShowAdd(true)}>+ Add New Fabric</button>
            {/* Removed: Add New Series */}
          </div>
        </div>

        <div className="series-grid">
          {series.map(s => (
            <SeriesCard
              key={s.id}
              series={s}
              onRename={(newName) =>
                setSeries(prev => prev.map(x => x.id === s.id ? { ...x, name: newName } : x))
              }
              onDelete={() => setSeries(prev => prev.filter(x => x.id !== s.id))}
              onRenameFabric={(fid, name) =>
                setSeries(prev => prev.map(x =>
                  x.id === s.id
                    ? { ...x, fabrics: x.fabrics.map(f => f.id === fid ? { ...f, name } : f) }
                    : x
                ))
              }
              onDeleteFabric={(fid) =>
                setSeries(prev => prev.map(x =>
                  x.id === s.id
                    ? { ...x, fabrics: x.fabrics.filter(f => f.id !== fid) }
                    : x
                ))
              }
            />
          ))}
          {!series.length && (
            <div className="muted">No series yet. Click “+ Add New Fabric”.</div>
          )}
        </div>
      </div>

      {/* Item Types placeholder card (optional separate section) */}
      <div className="card" style={{ marginTop: 16 }}>
        <h2 className="mb-2">Item Types</h2>
        <p className="muted">Coming next: manage product types & default prices here.</p>
      </div>

      {/* Modal for adding fabric (with series) */}
      {showAdd && (
        <AddFabricModal
          onCancel={() => setShowAdd(false)}
          onSave={(payload) => {
            handleAddFabric(payload);
            setShowAdd(false);
          }}
        />
      )}
    </div>
  );
}

/** ---------- Per-series card with right action rail ---------- */
function SeriesCard({
  series,
  onRename,
  onDelete,
  onRenameFabric,
  onDeleteFabric,
}) {
  const [edit, setEdit] = useState(false);
  const [selected, setSelected] = useState(null);

  const selectedFabric = useMemo(
    () => series.fabrics.find(f => f.id === selected) || null,
    [series.fabrics, selected]
  );

  // ESC exits edit mode
  useEffect(() => {
    function onKey(e) { if (e.key === "Escape") setEdit(false); }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  function renameSeries() {
    const name = prompt("Rename series:", series.name);
    if (name?.trim()) onRename(name.trim());
  }
  function deleteSeries() {
    if (confirm(`Delete series "${series.name}" and all its fabrics?`)) onDelete();
  }
  function renameFabric() {
    if (!selectedFabric) return;
    const name = prompt("Rename fabric:", selectedFabric.name);
    if (name?.trim()) onRenameFabric(selectedFabric.id, name.trim());
  }
  function deleteFabric() {
    if (!selectedFabric) return;
    if (confirm(`Delete "${selectedFabric.name}"?`)) onDeleteFabric(selectedFabric.id);
    setSelected(null);
  }

  return (
    <div className={"series-card" + (edit ? " has-rail" : "")}>
      {/* Header */}
      <div className="series-head">
        <div className="series-title">{series.name}</div>
        <div className="series-head-actions">
          <button className="secondary" onClick={() => setEdit(v => !v)}>
            {edit ? "Done" : "Edit"}
          </button>
        </div>
      </div>

      {/* Body list */}
      <ul className="series-list">
        {series.fabrics.map(f => (
          <li
            key={f.id}
            className={"series-row" + (selected === f.id ? " is-selected" : "")}
            onClick={() => setSelected(f.id)}
            title="Select to edit from the right-side rail"
          >
            <span className="series-bullet">▢</span>
            <span className="series-name">{f.name}</span>
          </li>
        ))}
        {!series.fabrics.length && <li className="muted">No fabrics yet.</li>}
      </ul>

      {/* Footer: delete series only (no per-card add) */}
      <div className="series-foot">
        <span />
        <button className="danger" onClick={deleteSeries}>Delete Series</button>
      </div>

      {/* Right-side action rail (appears in edit mode) */}
      {edit && (
        <div className="series-rail">
          <div className="rail-group">
            <div className="rail-title">Editing</div>
            <button className="secondary" onClick={() => setEdit(false)}>Done</button>
          </div>

          <div className="rail-group">
            <div className="rail-title">Series</div>
            <button className="secondary" onClick={renameSeries}>Rename</button>
          </div>

          <div className="rail-group">
            <div className="rail-title">Fabric</div>
            <button
              className="secondary"
              disabled={!selectedFabric}
              onClick={renameFabric}
              title={selectedFabric ? "" : "Select a fabric"}
            >
              Rename
            </button>
            <button
              className="danger"
              disabled={!selectedFabric}
              onClick={deleteFabric}
              title={selectedFabric ? "" : "Select a fabric"}
            >
              Delete
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/** ---------- Add Fabric Modal ---------- */
function AddFabricModal({ onCancel, onSave }) {
  const [seriesName, setSeriesName] = useState("");
  const [fabricName, setFabricName] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") onCancel();
      if (e.key === "Enter") submit();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seriesName, fabricName]);

  function submit() {
    if (!fabricName.trim()) {
      setError("Fabric name is required.");
      return;
    }
    onSave({
      seriesName: seriesName.trim() || "Miscellaneous",
      fabricName: fabricName.trim(),
    });
  }

  return (
    <div className="modal-backdrop" onMouseDown={(e) => {
      if (e.target.classList.contains("modal-backdrop")) onCancel();
    }}>
      <div className="modal-card" role="dialog" aria-modal="true">
        <div className="modal-title">Add New Fabric</div>
        <div className="row">
          <label>Series Name</label>
          <input
            value={seriesName}
            onChange={(e) => setSeriesName(e.target.value)}
            placeholder='Leave blank for "Miscellaneous"'
          />
        </div>
        <div className="row">
          <label>Fabric (Pattern) Name <span className="muted">(required)</span></label>
          <input
            value={fabricName}
            onChange={(e) => setFabricName(e.target.value)}
            placeholder="e.g., Eevee Friends"
            autoFocus
          />
        </div>
        {error && <div className="error-text">{error}</div>}

        <div className="modal-actions">
          <button className="secondary" onClick={onCancel}>Cancel</button>
          <button className="primary" onClick={submit}>Save</button>
        </div>
      </div>
    </div>
  );
}
