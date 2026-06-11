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