import { useEffect, useState } from "react";

// ============================================================================
// Suppliers — single persisted registry used by call-offs, price lists, BoQ.
// localStorage-backed (mock), same pattern as labour.ts / grnRegistry.ts.
// ============================================================================

export type Supplier = {
  id: string;
  name: string;
  isSeed: boolean;
  isActive: boolean;
  createdAt: number;
};

const KEY = "qp-suppliers";
const EVT = "qp-suppliers-change";

const SEEDS = [
  "CCF",
  "SIG",
  "Encon Insulation",
  "Nevill Long",
  "Minster",
  "Travis Perkins",
  "Jewson",
];

export function normaliseSupplierName(name: string): string {
  return name.trim().replace(/\s+/g, " ").toLowerCase();
}

function slug(name: string): string {
  return normaliseSupplierName(name).replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "x";
}

function emit() {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(EVT));
}

function write(rows: Supplier[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(rows));
  emit();
}

function read(): Supplier[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length) return parsed as Supplier[];
    }
  } catch {
    /* fall through to seed */
  }
  const base = Date.now();
  const seeded: Supplier[] = SEEDS.map((name, i) => ({
    id: `sup-${slug(name)}`,
    name,
    isSeed: true,
    isActive: true,
    createdAt: base + i,
  }));
  localStorage.setItem(KEY, JSON.stringify(seeded));
  return seeded;
}

function sortRows(rows: Supplier[]): Supplier[] {
  const byName = (a: Supplier, b: Supplier) => a.name.localeCompare(b.name);
  return [
    ...rows.filter((r) => r.isSeed).sort(byName),
    ...rows.filter((r) => !r.isSeed).sort(byName),
  ];
}

export function getSuppliers(): Supplier[] {
  return sortRows(read());
}

export function getActiveSuppliers(): Supplier[] {
  return getSuppliers().filter((s) => s.isActive);
}

export function findSupplierByName(name: string): Supplier | undefined {
  const n = normaliseSupplierName(name);
  return read().find((s) => normaliseSupplierName(s.name) === n);
}

/** Returns the EXISTING row on a normalised-name match — never duplicates. */
export function addSupplier(name: string): Supplier {
  const trimmed = name.trim().replace(/\s+/g, " ");
  const existing = findSupplierByName(trimmed);
  if (existing) return existing;
  const row: Supplier = {
    id: `sup-${slug(trimmed)}-${Date.now().toString(36)}`,
    name: trimmed,
    isSeed: false,
    isActive: true,
    createdAt: Date.now(),
  };
  write([...read(), row]);
  return row;
}

export function renameSupplier(id: string, name: string): void {
  const trimmed = name.trim().replace(/\s+/g, " ");
  if (!trimmed) throw new Error("Supplier name cannot be empty");
  const rows = read();
  const clash = rows.find(
    (s) => s.id !== id && normaliseSupplierName(s.name) === normaliseSupplierName(trimmed),
  );
  if (clash) throw new Error("A supplier with this name already exists");
  write(rows.map((s) => (s.id === id ? { ...s, name: trimmed } : s)));
}

export function setSupplierActive(id: string, active: boolean): void {
  write(read().map((s) => (s.id === id ? { ...s, isActive: active } : s)));
}

export function useSuppliers(): Supplier[] {
  const [rows, setRows] = useState<Supplier[]>([]);
  useEffect(() => {
    const refresh = () => setRows(getSuppliers());
    refresh();
    const onStorage = (e: StorageEvent) => { if (e.key === KEY) refresh(); };
    window.addEventListener(EVT, refresh);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener(EVT, refresh);
      window.removeEventListener("storage", onStorage);
    };
  }, []);
  return rows;
}
