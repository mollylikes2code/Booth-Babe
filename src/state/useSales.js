import { useCallback, useEffect, useState } from "react";

/* ---------- storage keys ---------- */
const STORAGE_KEY      = "bb_sales";        // current location for sales
const LEGACY_KEY       = "sales";           // your old key (migrated once)
const EVENT_NAME_KEY   = "bb_event_name";
const EVENT_START_KEY  = "bb_event_start";

/* ---------- helpers ---------- */
function uniqById(arr = []) {
  const seen = new Set();
  const out = [];
  for (const it of arr || []) {
    if (!it || it.id == null || seen.has(it.id)) continue;
    seen.add(it.id);
    out.push(it);
  }
  return out;
}

function safeParse(json, fallback) {
  try { return JSON.parse(json); } catch { return fallback; }
}

/** Load sales from new key; if missing, migrate once from legacy key. */
function loadInitialSales() {
  const v2 = safeParse(localStorage.getItem(STORAGE_KEY), null);
  if (Array.isArray(v2)) return uniqById(v2);

  const legacy = safeParse(localStorage.getItem(LEGACY_KEY), []);
  if (Array.isArray(legacy) && legacy.length) {
    const migrated = uniqById(legacy);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
      // do NOT delete legacy automatically; leaving it is safer
    } catch {/* ignore */}
    return migrated;
  }
  return [];
}

function saveSalesLS(sales) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(sales)); } catch {/* ignore */}
}

function loadEventFromLS() {
  const name = localStorage.getItem(EVENT_NAME_KEY) || null;
  const raw  = localStorage.getItem(EVENT_START_KEY);
  const n    = raw == null ? null : Number(raw);
  return { name, start: Number.isFinite(n) ? n : null };
}

function saveEventToLS(name, start) {
  try {
    if (name) localStorage.setItem(EVENT_NAME_KEY, name);
    else localStorage.removeItem(EVENT_NAME_KEY);

    if (start != null) localStorage.setItem(EVENT_START_KEY, String(start));
    else localStorage.removeItem(EVENT_START_KEY);
  } catch {/* ignore */}
}

/* ---------- the hook ---------- */
export default function useSales() {
  // sales list
  const [sales, setSales] = useState(loadInitialSales());

  // event state (name + start timestamp)
  const [{ name: eventName, start: eventStart }, setEvent] = useState(loadEventFromLS());

  // persist whenever state changes
  useEffect(() => saveSalesLS(sales), [sales]);
  useEffect(() => saveEventToLS(eventName, eventStart), [eventName, eventStart]);

  // add a sale; if an event is active, tag it
  const appendSale = useCallback((sale) => {
    const tagged = eventName ? { ...sale, event: eventName } : sale;
    setSales(prev => uniqById([...(prev || []), tagged]));
  }, [eventName]);

  const clearSales = useCallback(() => setSales([]), []);

  // event controls
  const startEvent = useCallback((name) => {
    const trimmed = (name || "").trim();
    if (!trimmed) return;
    setEvent({ name: trimmed, start: Date.now() });
  }, []);

  const endEvent = useCallback(() => setEvent({ name: null, start: null }), []);

  return {
    sales,
    appendSale,
    clearSales,
    // event API
    eventName,
    eventStart,
    startEvent,
    endEvent,
    // optional: direct timestamp edit if you ever need it
    setEventStart: (ts) => setEvent(ev => ({ ...ev, start: ts }))
  };
}
