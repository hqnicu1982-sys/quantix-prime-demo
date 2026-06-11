import { useEffect, useState } from "react";
import { priceListUploads as seedUploads } from "./mockData";

// ============================================================================
// Price List Registry — persistent ledger of supplier price-list uploads.
// Backs both the upload page (recent uploads list) and any downstream
// consumer that wants to know "what suppliers have we indexed lately".
// localStorage-backed (mock).
// ============================================================================

export type PriceListStatus = "ok" | "review";

export type PriceListUpload = {
  id: string;
  name: string;
  date: string;          // human-readable
  items: number;
  matched: number;
  review: number;
  historical?: number;
  status: PriceListStatus;
  supplier?: string;
  uploadedBy?: string;
  createdAt: number;
};

const KEY = "qp-pricelist-registry";
const SEED_KEY = "qp-pricelist-registry-seeded-v1";
const EVT = "qp-pricelist-registry-change";

function read(): PriceListUpload[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? (arr as PriceListUpload[]) : [];
  } catch {
    return [];
  }
}

function write(list: PriceListUpload[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(list));
  window.dispatchEvent(new Event(EVT));
}

function ensureSeed() {
  if (typeof window === "undefined") return;
  if (localStorage.getItem(SEED_KEY)) return;
  const seeds: PriceListUpload[] = seedUploads.map((u) => ({
    id: `pl-seed-${u.id}`,
    name: u.name,
    date: u.date,
    items: u.items,
    matched: u.matched,
    review: u.review,
    historical: (u as { historical?: number }).historical,
    status: u.status,
    createdAt: Date.now() - u.id * 60_000,
  }));
  write(seeds);
  localStorage.setItem(SEED_KEY, "1");
}

function uid() {
  return `pl-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

function formatDate(d = new Date()) {
  return d.toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

// ---------- queries ----------

export function getPriceListUploads(): PriceListUpload[] {
  ensureSeed();
  return read().sort((a, b) => b.createdAt - a.createdAt);
}

// ---------- mutations ----------

export type LogUploadInput = {
  name: string;
  items: number;
  matched: number;
  review: number;
  supplier?: string;
  uploadedBy?: string;
};

export function logPriceListUpload(input: LogUploadInput): PriceListUpload {
  ensureSeed();
  const list = read();
  const record: PriceListUpload = {
    id: uid(),
    name: input.name,
    date: formatDate(),
    items: input.items,
    matched: input.matched,
    review: input.review,
    status: input.review > 0 ? "review" : "ok",
    supplier: input.supplier,
    uploadedBy: input.uploadedBy,
    createdAt: Date.now(),
  };
  write([record, ...list]);
  return record;
}

export function deletePriceListUpload(id: string) {
  write(read().filter((u) => u.id !== id));
}

export function clearPriceListRegistry() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(KEY);
  localStorage.removeItem(SEED_KEY);
  window.dispatchEvent(new Event(EVT));
}

// ---------- React hooks ----------

export function usePriceListUploads(): PriceListUpload[] {
  const [state, setState] = useState<PriceListUpload[]>(() => getPriceListUploads());
  useEffect(() => {
    const refresh = () => setState(getPriceListUploads());
    refresh();
    const onStorage = (e: StorageEvent) => { if (e.key === KEY) refresh(); };
    window.addEventListener(EVT, refresh);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener(EVT, refresh);
      window.removeEventListener("storage", onStorage);
    };
  }, []);
  return state;
}

// ---------- Derived: supplier-level stats ----------

const KNOWN_SUPPLIERS = [
  "CCF",
  "Minster",
  "Travis Perkins",
  "Wolseley",
  "Jewson",
  "Wickes",
  "Selco",
];

export function extractSupplier(name: string): string {
  const lower = name.toLowerCase();
  return KNOWN_SUPPLIERS.find((s) => lower.includes(s.toLowerCase())) ?? "Other";
}

/**
 * Deterministic synthetic uplift % per supplier — stable per name, range −3..+5%.
 * Used to surface a "since last upload" variation chip without a real price index.
 */
export function supplierVariationPct(supplier: string): number {
  let h = 0;
  for (let i = 0; i < supplier.length; i++) h = (h * 31 + supplier.charCodeAt(i)) | 0;
  const raw = ((h % 80) + 80) % 80; // 0..79
  return Math.round((raw / 10 - 3) * 10) / 10; // -3.0 .. +4.9
}

export type SupplierStat = {
  supplier: string;
  uploads: number;
  items: number;
  matched: number;
  review: number;
  lastUpload: string;
  lastCreatedAt: number;
  variationPct: number;
};

export function getSupplierStats(): SupplierStat[] {
  const byName = new Map<string, SupplierStat>();
  for (const u of getPriceListUploads()) {
    const supplier = extractSupplier(u.name);
    const cur = byName.get(supplier) ?? {
      supplier,
      uploads: 0,
      items: 0,
      matched: 0,
      review: 0,
      lastUpload: u.date,
      lastCreatedAt: u.createdAt,
      variationPct: supplierVariationPct(supplier),
    };
    cur.uploads += 1;
    cur.items += u.items;
    cur.matched += u.matched;
    cur.review += u.review;
    if (u.createdAt > cur.lastCreatedAt) {
      cur.lastCreatedAt = u.createdAt;
      cur.lastUpload = u.date;
    }
    byName.set(supplier, cur);
  }
  return Array.from(byName.values()).sort((a, b) => b.lastCreatedAt - a.lastCreatedAt);
}

export function useSupplierStats(): SupplierStat[] {
  const uploads = usePriceListUploads();
  // recompute when uploads change
  void uploads;
  return getSupplierStats();
}

export function useSupplierStat(supplier: string | undefined): SupplierStat | undefined {
  const stats = useSupplierStats();
  if (!supplier) return undefined;
  return stats.find((s) => s.supplier.toLowerCase() === supplier.toLowerCase());
}