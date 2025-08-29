// src/state/useCatalog.js
import { useEffect, useMemo, useState } from "react";

/** ---- LocalStorage keys ---- */
const LS_SERIES    = "bb_series";
const LS_FABRICS   = "bb_fabrics";     // [{ id, series, pattern }]
const LS_ITEMTYPES = "bb_itemTypes";   // [{ type, defaultPrice, notes }]

function parse(json, fallback) {
  try { return json ? JSON.parse(json) : fallback; } catch { return fallback; }
}

export default function useCatalog() {
  // ----- State (load once) -----
  const [series, setSeries] = useState(() =>
    parse(localStorage.getItem(LS_SERIES), ["Core", "Holiday", "Limited", "Miscellaneous"])
  );

  const [fabrics, setFabrics] = useState(() =>
    parse(localStorage.getItem(LS_FABRICS), [
      // starter examples (optional)
      { id: crypto.randomUUID(), series: "Core",          pattern: "Pokemon" },
      { id: crypto.randomUUID(), series: "Core",          pattern: "Sailor Moon" },
      { id: crypto.randomUUID(), series: "Miscellaneous", pattern: "Space" },
    ])
  );

  const [itemTypes, setItemTypes] = useState(() =>
    parse(localStorage.getItem(LS_ITEMTYPES), [
      { type: "Buttons",     defaultPrice: 2,  notes: "" },
      { type: "Pouches",     defaultPrice: 10, notes: "" },
      { type: "Hat",         defaultPrice: 15, notes: "" },
      { type: "Wristlet",    defaultPrice: 10, notes: "" },
      { type: "Keychain",    defaultPrice: 5,  notes: "" },
      { type: "Scrunchie",   defaultPrice: 5,  notes: "" },
      { type: "Dreamcatcher",defaultPrice: 7,  notes: "" },
    ])
  );

  // ----- Persist -----
  useEffect(() => localStorage.setItem(LS_SERIES, JSON.stringify(series)), [series]);
  useEffect(() => localStorage.setItem(LS_FABRICS, JSON.stringify(fabrics)), [fabrics]);
  useEffect(() => localStorage.setItem(LS_ITEMTYPES, JSON.stringify(itemTypes)), [itemTypes]);

  // ----- Derived: fabrics grouped by series -----
  const fabricsBySeries = useMemo(() => {
    const map = new Map();
    for (const f of fabrics) {
      const k = f.series || "Miscellaneous";
      if (!map.has(k)) map.set(k, []);
      map.get(k).push(f);
    }
    return Array.from(map.entries())
      .sort(([a],[b]) => a.localeCompare(b))
      .map(([key, list]) => [key, list.sort((a,b)=>a.pattern.localeCompare(b.pattern))]);
  }, [fabrics]);

  // ----- Derived: flattened options for RingUp -----
  const fabricOptions = useMemo(() => {
    return [...fabrics]
      .sort((a, b) => {
        const sa = a.series.localeCompare(b.series);
        return sa !== 0 ? sa : a.pattern.localeCompare(b.pattern);
      })
      .map(f => ({
        id: f.id,
        series: f.series || "Miscellaneous",
        pattern: f.pattern,
        label: `${f.series || "Miscellaneous"} — ${f.pattern}`,
      }));
  }, [fabrics]);

  // ----- Actions -----
  function ensureSeries(name) {
    const s = (name || "").trim() || "Miscellaneous";
    if (!series.includes(s)) setSeries(prev => [...prev, s]);
    return s;
  }

  function addFabric({ series: s, pattern }) {
    const pat = String(pattern || "").trim();
    const normalizedSeries = ensureSeries(s);
    if (!pat) return;

    const exists = fabrics.some(
      f => f.series === normalizedSeries && f.pattern.toLowerCase() === pat.toLowerCase()
    );
    if (exists) return;

    setFabrics(prev => [...prev, { id: crypto.randomUUID(), series: normalizedSeries, pattern: pat }]);
  }

  function removeFabric(id) {
    setFabrics(prev => prev.filter(f => f.id !== id));
  }

  function addItemType({ type, defaultPrice = 0, notes = "" }) {
    const t = String(type || "").trim();
    const price = Number(defaultPrice) || 0;
    const n = String(notes || "");
    if (!t) return;

    const exists = itemTypes.some(it => it.type.toLowerCase() === t.toLowerCase());
    if (!exists) setItemTypes(prev => [...prev, { type: t, defaultPrice: price, notes: n }]);
  }

  function removeItemType(type) {
    const key = String(type || "").toLowerCase();
    setItemTypes(prev => prev.filter(it => it.type.toLowerCase() !== key));
  }

  return {
    // data
    series,
    fabrics,
    itemTypes,
    fabricsBySeries,
    fabricOptions,

    // mutations
    addFabric,
    removeFabric,
    addItemType,
    removeItemType,
  };
}
