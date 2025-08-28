// src/state/useCatalog.js
import { useEffect, useState, useMemo } from "react";

// LocalStorage keys
const LS_TYPES = "bb_catalog_types";
const LS_PATTERNS = "bb_catalog_patterns";
const LS_SERIES = "bb_catalog_series";

// Reasonable defaults (used on first run only)
const DEFAULT_TYPES = [
  { id: crypto.randomUUID(), type: "Buttons", defaultPrice: 2 },
  { id: crypto.randomUUID(), type: "Pouches", defaultPrice: 10 },
  { id: crypto.randomUUID(), type: "Hat", defaultPrice: 15 },
  { id: crypto.randomUUID(), type: "Wristlet", defaultPrice: 10 },
  { id: crypto.randomUUID(), type: "Keychain", defaultPrice: 5 },
  { id: crypto.randomUUID(), type: "Scrunchie", defaultPrice: 5 },
  { id: crypto.randomUUID(), type: "Dreamcatcher", defaultPrice: 7 },
];

const DEFAULT_PATTERNS = [
  "Mini Mouse","Dino Cookie","Pokemon","Space","Hazbin -- Charlie",
  "MLP","Sailor Moon","Bluey","Carebear","Witchy",
];

const DEFAULT_SERIES = ["Core", "Seasonal", "Limited"];

function safeParse(json, fallback) {
  try { return json ? JSON.parse(json) : fallback; } catch { return fallback; }
}

export default function useCatalog() {
  const [types, setTypes] = useState(() =>
    safeParse(localStorage.getItem(LS_TYPES), DEFAULT_TYPES)
  );
  const [patterns, setPatterns] = useState(() =>
    safeParse(localStorage.getItem(LS_PATTERNS), DEFAULT_PATTERNS)
  );
  const [series, setSeries] = useState(() =>
    safeParse(localStorage.getItem(LS_SERIES), DEFAULT_SERIES)
  );

  // persist
  useEffect(() => localStorage.setItem(LS_TYPES, JSON.stringify(types)), [types]);
  useEffect(() => localStorage.setItem(LS_PATTERNS, JSON.stringify(patterns)), [patterns]);
  useEffect(() => localStorage.setItem(LS_SERIES, JSON.stringify(series)), [series]);

  // helpers: Product Types (array of {id, type, defaultPrice})
  const addType = (type, defaultPrice = 0) =>
    setTypes((prev) => prev.concat({ id: crypto.randomUUID(), type: type.trim(), defaultPrice: Number(defaultPrice)||0 }));

  const updateType = (id, patch) =>
    setTypes((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)));

  const deleteType = (id) => setTypes((prev) => prev.filter((t) => t.id !== id));

  // helpers: Patterns (array of strings)
  const addPattern = (name) =>
    setPatterns((prev) => [...new Set(prev.concat(name.trim()))].filter(Boolean));
  const renamePattern = (oldName, newName) =>
    setPatterns((prev) => prev.map((p) => (p === oldName ? newName.trim() : p)));
  const deletePattern = (name) =>
    setPatterns((prev) => prev.filter((p) => p !== name));

  // helpers: Series (array of strings)
  const addSeries = (name) =>
    setSeries((prev) => [...new Set(prev.concat(name.trim()))].filter(Boolean));
  const renameSeries = (oldName, newName) =>
    setSeries((prev) => prev.map((s) => (s === oldName ? newName.trim() : s)));
  const deleteSeries = (name) =>
    setSeries((prev) => prev.filter((s) => s !== name));

  // quick maps for selects
  const typeNames = useMemo(() => types.map((t) => t.type), [types]);

  return {
    types, typeNames, addType, updateType, deleteType,
    patterns, addPattern, renamePattern, deletePattern,
    series, addSeries, renameSeries, deleteSeries,
  };
}
