import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { Project } from "./mockData";

/** The one fictional sample project every organisation gets. Never counts in portfolio numbers. */
export const SAMPLE_PROJECT_ID = "sample-harbour-yard";

export const SAMPLE_PROJECT: Project = {
  id: SAMPLE_PROJECT_ID,
  name: "Harbour Yard Offices — Level 2 fit-out",
  subtitle: "Drylining · Harbour Yard, Bristol · Level 2",
  mainContractor: "Northgate Construction Ltd",
  contractValue: 385000,
  margin: 19.5,
  progress: 46,
  health: "healthy",
  startDate: "06/04/2026",
  endDate: "27/11/2026",
  hasFullData: false,
  status: "active",
  isSample: true,
};

export const SAMPLE_DESCRIPTION =
  "A complete example: costed BoQ, 3 merchant quotes compared, call-offs, invoices, variations and site reports.";
export const SAMPLE_REFUSED_NOTE =
  "The sample project uses example data. Upload your own documents into one of your projects.";
export const SAMPLE_NOT_AVAILABLE = "Not available on the sample project.";

export const isSampleId = (id?: string | null) => id === SAMPLE_PROJECT_ID;

const SLOT_HIDDEN_KEY = "qp-sample-slot-hidden";
const MISSING_KEY = "qp-sample-missing";
const BANNER_COLLAPSED_KEY = "qp-sample-banner-collapsed";
const EVT = "qp-sample-change";

type SampleState = { slotHidden: boolean; missing: boolean; bannerCollapsed: boolean };

function read(): SampleState {
  if (typeof window === "undefined") return { slotHidden: false, missing: false, bannerCollapsed: false };
  return {
    slotHidden: localStorage.getItem(SLOT_HIDDEN_KEY) === "1",
    missing: localStorage.getItem(MISSING_KEY) === "1",
    bannerCollapsed: localStorage.getItem(BANNER_COLLAPSED_KEY) === "1",
  };
}

function setFlag(key: string, on: boolean) {
  if (typeof window === "undefined") return;
  if (on) localStorage.setItem(key, "1");
  else localStorage.removeItem(key);
  window.dispatchEvent(new CustomEvent(EVT));
}

export const setSampleSlotHidden = (v: boolean) => setFlag(SLOT_HIDDEN_KEY, v);
export const setSampleBannerCollapsed = (v: boolean) => setFlag(BANNER_COLLAPSED_KEY, v);
/** Demo hook to preview the "sample failed to create" state. */
export const setSampleMissing = (v: boolean) => setFlag(MISSING_KEY, v);

export function useSampleState(): SampleState {
  const [s, setS] = useState<SampleState>({ slotHidden: false, missing: false, bannerCollapsed: false });
  useEffect(() => {
    const sync = () => setS(read());
    sync();
    window.addEventListener(EVT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(EVT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);
  return s;
}

/** Wipes every locally stored change scoped to the sample project and restores it. */
export async function resetSampleProject(): Promise<void> {
  await new Promise((r) => setTimeout(r, 900));
  if (typeof window === "undefined") return;
  const keys: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && k.includes(SAMPLE_PROJECT_ID)) keys.push(k);
  }
  keys.forEach((k) => localStorage.removeItem(k));
  localStorage.removeItem(MISSING_KEY);
  window.dispatchEvent(new CustomEvent(EVT));
}

/** Toast used after supplier-facing actions (dispute, chase, credit request). */
export function supplierActionToast(projectId: string | undefined, normal: () => void) {
  if (isSampleId(projectId)) toast.success("Saved. Example project — no email sent.");
  else normal();
}
