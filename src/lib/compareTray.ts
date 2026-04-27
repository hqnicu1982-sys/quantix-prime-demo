// Tiny cross-page store for the Compare tray (A/B slots).
// Used by Catalog (send) and Calculator (receive).

export type CompareSide = "A" | "B";
export type CompareSlots = { A: string | null; B: string | null };

const KEY = "bg.compare.slots.v1";
const EVT = "bg:compare-slots-changed";

const empty: CompareSlots = { A: null, B: null };

export function readSlots(): CompareSlots {
  if (typeof window === "undefined") return empty;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return empty;
    const parsed = JSON.parse(raw) as Partial<CompareSlots>;
    return { A: parsed.A ?? null, B: parsed.B ?? null };
  } catch {
    return empty;
  }
}

export function writeSlots(slots: CompareSlots) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(slots));
  window.dispatchEvent(new CustomEvent(EVT));
}

/** Push a code into the next free slot, or replace A if both full. Returns the side used. */
export function pushToTray(code: string): CompareSide {
  const cur = readSlots();
  if (cur.A === code || cur.B === code) {
    return cur.A === code ? "A" : "B";
  }
  let side: CompareSide;
  if (!cur.A) side = "A";
  else if (!cur.B) side = "B";
  else side = "A"; // both full → replace A (oldest)
  const next: CompareSlots = { ...cur, [side]: code };
  writeSlots(next);
  return side;
}

export function setSlot(side: CompareSide, code: string | null) {
  const cur = readSlots();
  writeSlots({ ...cur, [side]: code });
}

export function clearTray() {
  writeSlots(empty);
}

/** Subscribe to slot changes (same tab + cross-tab). */
export function subscribe(cb: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  const onLocal = () => cb();
  const onStorage = (e: StorageEvent) => { if (e.key === KEY) cb(); };
  window.addEventListener(EVT, onLocal);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(EVT, onLocal);
    window.removeEventListener("storage", onStorage);
  };
}