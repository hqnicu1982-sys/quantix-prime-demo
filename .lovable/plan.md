# Plan: Variations MVP (Pașii 1-3 + 5)

## Scope
Livrăm **doar tab-ul Variations** cu CRUD + workflow de approval. Nu atingem încă BoQ, Call-offs, Financial sau Calculator. Userul poate crea VO-uri, le mută prin status, vede totaluri — dar nu se reflectă încă în BoQ live. Integrarea full vine în iterația următoare.

**Decizii implicite (poți schimba după ce vezi MVP-ul):**
- Workflow: 4 statusuri — `draft → submitted → approved → rejected` (+ `implemented` later)
- Sursă VO: doar manual din dialog (auto-detect din Calculator vine în iter 2)

## Ce construim

### 1. Model de date — `src/lib/variations.ts`
```text
ProjectVariation {
  id: "VO-001" (auto-incremented per project)
  title, reason
  raisedBy: "client" | "contractor" | "designer" | "site"
  raisedDate (ISO)
  status: "draft" | "submitted" | "approved" | "rejected"
  
  changes: VariationChange[]
  costImpact: number       // suma changes
  timeImpactDays: number
  approvedValue?: number   // setat când status = approved
  approvedDate?: string
  
  attachments: { name: string }[]  // mock — doar nume fișier
}

VariationChange {
  id, op: "add_system" | "modify_system" | "remove_line" | "add_line" | "adjust_qty"
  description: string      // ex: "Add 1 extra layer Soundbloc 15mm to Bedrooms L3"
  qty?: number
  unit?: string
  ratePerUnit?: number
  lineTotal: number        // qty × rate, sau manual
}
```

Storage: `localStorage` cheie `qp-project-variations-{projectId}`, pattern identic cu `projectData.ts` (CustomEvent pentru reactivitate).

API:
- `useProjectVariations(projectId)` — hook
- `addVariation(projectId, input)`, `updateVariation`, `setStatus(id, status, approvedValue?)`, `deleteVariation`
- `getNextVoNumber(projectId)` → "VO-001", "VO-002", …
- `summarize(variations)` → `{ approved, pending, rejected, totalImpact, timeImpactDays }`

### 2. Componente UI

**`src/components/variations/VariationStatusBadge.tsx`**
Badge color-coded: draft (gri), submitted (galben), approved (verde), rejected (roșu).

**`src/components/variations/VariationsTable.tsx`**
Coloane: ID · Title · Raised by · Date · Cost impact · Time (days) · Status · Actions (View / Submit / Approve / Reject / Delete). Filtre rapide pe status.

**`src/components/variations/NewVariationDialog.tsx`**
- Câmpuri header: title*, reason, raised by (radio), raised date
- Attachments: input file (mock — doar reține `name`)
- **Changes editor** (lista dinamică, "+ Add change"):
  - op (select), description (text), qty + unit + rate (number) → lineTotal auto
- Time impact (days)
- Auto-totals: costImpact = sum(lineTotal)
- Footer: "Save as draft" / "Save & submit"

**`src/components/variations/VariationDetailDrawer.tsx`** (sau dialog read-only cu edit toggle)
- Toate detaliile + listă changes + attachments
- Buttons în funcție de status:
  - `draft` → Edit · Submit · Delete
  - `submitted` → Approve (cere `approvedValue`, default = costImpact) · Reject (cere reason scurt)
  - `approved` / `rejected` → doar view + Reopen to draft

### 3. Rute noi

**`src/routes/variations.tsx`** — vedere generică pe `useProject().current`
- `<ProjectBanner scope="Variations" />`
- Header KPIs (4 carduri Kpi):
  - Approved value (£)
  - Pending value (£) — submitted
  - Net contract = contractValue + approved
  - % uplift vs contract
- `<NewVariationDialog />` trigger
- `<VariationsTable />`

**`src/routes/projects.fitzrovia.variations.tsx`** — wrapper care folosește exact aceeași listă (filtrată pe `fitzrovia`), pentru ca tab-ul Fitzrovia să fie consistent.

### 4. Integrări minore navigation

- `src/routes/projects.fitzrovia.tsx` — adaugă `{ to: "/projects/fitzrovia/variations", label: "Variations" }` în array-ul de tabs (între Invoices și Labour)
- `src/components/AppLayout.tsx` — adaugă link "Variations" în nav-ul principal (lângă Costed BoQ / Call-offs)

### 5. Seed mock pentru Fitzrovia
La prima accesare, dacă nu există variations pentru `fitzrovia`, seed cu 2-3 exemple:
- VO-001 "Upgrade acoustic spec L3-L5" — approved, £8,400
- VO-002 "Add bulkheads in lobby" — submitted, £3,200
- VO-003 "Remove partition in meeting room" — draft, -£1,100

## Out of scope (iterația următoare)
- Buton "Add as variation" în Calculator
- Toggle baseline/VO în Costed BoQ + badges pe linii
- VO lines eligible la Call-offs
- Card Variations în Financial
- Status `implemented` care merge linii efectiv în BoQ live
- Export PDF VO pack

## Fișiere
**Create (6):** `src/lib/variations.ts`, `src/components/variations/VariationStatusBadge.tsx`, `VariationsTable.tsx`, `NewVariationDialog.tsx`, `VariationDetailDrawer.tsx`, `src/routes/variations.tsx`, `src/routes/projects.fitzrovia.variations.tsx`

**Edit (2):** `src/routes/projects.fitzrovia.tsx` (tab nav), `src/components/AppLayout.tsx` (sidebar link)

După ce aprobi, implementez direct — totul stă pe localStorage, nu necesită Cloud.
