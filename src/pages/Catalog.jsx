// src/pages/Catalog.jsx
import { useState } from "react";
import useCatalog from "../state/useCatalog";

export default function Catalog() {
  const {
    patterns, series,
    addPattern, removePattern,
    addSeries,  removeSeries,
  } = useCatalog();

  return (
    <div className="wrap">
      <h1>Booth Babe – Catalog</h1>

      {/* Header / tools */}
      <section className="card">
        <div className="toolbar">
          <h2>Catalog Manager</h2>
        </div>
        <p className="muted">
          Manage the lists Cat will pick from while ringing up sales. 
          Changes are saved to this device automatically.
        </p>
      </section>

      {/* Patterns */}
      <Section title="Patterns">
        <AddOne placeholder="Add a pattern…" onAdd={addPattern} />
        <EditableList
          rows={patterns}
          onRename={(oldVal, newVal) => {
            if (!newVal || newVal.trim() === oldVal) return;
            removePattern(oldVal);
            addPattern(newVal.trim());
          }}
          onDelete={removePattern}
          emptyHint="No patterns yet — add some above."
        />
      </Section>

      {/* Series */}
      <Section title="Series">
        <AddOne placeholder="Add a series…" onAdd={addSeries} />
        <EditableList
          rows={series}
          onRename={(oldVal, newVal) => {
            if (!newVal || newVal.trim() === oldVal) return;
            removeSeries(oldVal);
            addSeries(newVal.trim());
          }}
          onDelete={removeSeries}
          emptyHint="No series yet — add some above."
        />
      </Section>

      {/* Optional note */}
      <section className="card">
        <div className="toolbar">
          <h3>Coming soon: Product Types & Default Prices</h3>
        </div>
        <p className="muted">
          If you want Cat to manage product types and default prices here too, 
          we’ll extend <code>useCatalog.js</code> to include a <code>types</code> list. 
          For tonight, patterns and series are editable.
        </p>
      </section>
    </div>
  );
}

/* ---------- Reusable bits ---------- */

function Section({ title, children }) {
  return (
    <section className="card">
      <div className="toolbar">
        <h2>{title}</h2>
      </div>
      {children}
    </section>
  );
}

function AddOne({ placeholder, onAdd }) {
  const [val, setVal] = useState("");
  return (
    <form
      className="row"
      onSubmit={(e) => {
        e.preventDefault();
        const v = (val || "").trim();
        if (!v) return;
        onAdd(v);
        setVal("");
      }}
    >
      <div className="inline">
        <input
          placeholder={placeholder}
          value={val}
          onChange={(e) => setVal(e.target.value)}
        />
        <button className="primary" type="submit">Add</button>
      </div>
    </form>
  );
}

function EditableList({ rows = [], onRename, onDelete, emptyHint }) {
  if (!rows.length) return <p className="muted">{emptyHint}</p>;
  return (
    <table>
      <tbody>
        {rows.map((name) => (
          <EditableRow
            key={name}
            name={name}
            onRename={onRename}
            onDelete={onDelete}
          />
        ))}
      </tbody>
    </table>
  );
}

function EditableRow({ name, onRename, onDelete }) {
  const [edit, setEdit] = useState(false);
  const [val, setVal] = useState(name);

  return (
    <tr>
      <td style={{ width: "100%" }}>
        {edit ? (
          <input value={val} onChange={(e) => setVal(e.target.value)} />
        ) : (
          <span>{name}</span>
        )}
      </td>
      <td style={{ width: 180 }}>
        {edit ? (
          <>
            <button
              className="success"
              onClick={() => {
                if (val.trim()) onRename(name, val.trim());
                setEdit(false);
              }}
            >
              Save
            </button>{" "}
            <button
              className="secondary"
              onClick={() => {
                setVal(name);
                setEdit(false);
              }}
            >
              Cancel
            </button>
          </>
        ) : (
          <>
            <button className="secondary" onClick={() => setEdit(true)}>
              Edit
            </button>{" "}
            <button className="danger" onClick={() => onDelete(name)}>
              Delete
            </button>
          </>
        )}
      </td>
    </tr>
  );
}
