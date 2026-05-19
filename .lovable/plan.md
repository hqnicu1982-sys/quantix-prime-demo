
# Scenariu: Call-offs plafonate de BoQ-ul estimatorului

## Obiectiv
Site Managerul nu poate comanda mai mult decât a aprobat estimatorul. Fiecare linie din BoQ devine un buget de materiale; call-offs scad din buget; o pagină de alocare arată cât a mai rămas de comandat per sistem.

## Flux end-to-end
```text
Estimator (Calculator)
   └── adaugă sisteme → BoQ proiect          (qtyApproved per material)
        │
Site Manager
   ├── Allocation page (per project)         ← NEW
   │     • vede sisteme + linii BoQ
   │     • coloane: Approved / Ordered / Remaining / %
   │     • buton "Call-off" pe fiecare linie (sau bulk)
   │
   └── New call-off wizard                    ← MODIFIED
         • pre-completat din linia aleasă
         • input Qty plafonat hard la Remaining
         • permite partial (orice qty ≤ Remaining)
         • la Submit: rezervă qty (pending), nu scade încă
              QS approve  → committed
              QS reject   → eliberează rezervarea
              GRN closed  → consumed (rămâne scăzut)
```

## Model de date (extensie `projectData.ts`)
```ts
ProjectBoqLine += {
  qtyApproved: number;     // setat când estimatorul adaugă sistemul
  qtyOrdered:  number;     // sum(committed) — derivat
  qtyPending:  number;     // sum(draft+submitted+reviewed) — derivat
}

ProjectCallOffLine = {
  callOffId, boqLineId, systemId, qty
}

ProjectCallOff += { lines: ProjectCallOffLine[], state: CallOffState }
```
Selectori derivati:
- `remaining(line) = qtyApproved − qtyOrdered − qtyPending`
- `pctOrdered(system) = Σ qtyOrdered / Σ qtyApproved`

## Reguli (engine)
1. `qty > remaining` → blocat în wizard (input clamp + eroare inline).
2. Rezervarea se face la **Submitted**; eliberată la **Rejected**.
3. La **Approved** rezervarea devine `qtyOrdered` (committed).
4. La **Closed** (GRN) rămâne consumat — alimentează `qtyDelivered` (vizibil dar nu afectează remaining).
5. Toate scăderile pe linia BoQ exactă — nu pe material generic (suportă același material în mai multe sisteme).

## Pagini noi / modificate

### NEW `/projects/$projectId/allocation` (Materials allocation)
- KPI strip: Approved value, Ordered %, Remaining value, Lines fully consumed.
- Card per **sistem** (acordeon): cod sistem, arie, % ordered (progress bar).
  - Tabel linii: Material · Approved · Ordered · Pending · Remaining · Bar · [Call-off]
- Filtre: doar cu remaining > 0, doar pending, search.
- Buton bulk: "Call-off selected lines" → wizard pre-completat cu multi-linii.

### MODIFIED `/calloffs/new`
- Step 1 "Pick BoQ line" → dropdown grupat pe sistem, afișează `Remaining` per linie, dezactivează liniile epuizate.
- Step 2 "Quantity" → `max = remaining`, helper "X m² rămase din Y aprobate", clamp + toast la depășire.
- Step 4 "Submit" → arată impact: "După submit: Remaining 1,850 → 0 m² (rezervat)".

### MODIFIED `/projects/$projectId/calloffs`
- Adaugă coloană "BoQ linie" + link înapoi la Allocation.
- KPI nou: "% BoQ consumed".

### MODIFIED `/projects/$projectId/costed-boq`
- Coloane noi: Ordered, Remaining, mini-bar.
- Link "Order from this line" → wizard pre-completat.

### MODIFIED `WorkflowStrip`
- Sub strip, mic indicator: "Reserves 1,850 m² from BoQ line 14".

## Navigație
- Adaugă tab "Materials" în sidebar-ul proiectului (între Specification și Call-offs).
- Banner cross-link: din Call-offs Inbox un buton "Open allocation".

## Detalii tehnice
- Toată logica derivată într-un selector pur `src/lib/boqAllocation.ts`:
  - `getAllocation(projectId): SystemAllocation[]`
  - `canOrder(lineId, qty): { ok, remaining, reason? }`
  - `reserve(callOffId, lines)`, `commit(callOffId)`, `release(callOffId)`
- Hook `useBoqAllocation(projectId)` — re-evaluează pe evenimentul `qp-project-data-change` deja existent.
- Persistență: extinde `localStorage` (mock) — fără backend nou.
- Permisiuni: `view.boq` pentru Allocation page; `create.calloffs` pentru butoanele de comandă.

## Edge cases acoperite
- Material în mai multe sisteme → buget per linie, nu per material.
- Reject după Submit → eliberare automată a rezervării.
- Sistem șters de estimator cu call-offs deja committed → linia rămâne read-only marcată "orphaned", blochează ștergerea.
- Variation (qty crescut de estimator) → remaining recalculat automat.

## Demo flow după implementare
1. Calculator → adaugă "GIWL-146" 200 m² → BoQ are WallBoard 220 m² approved.
2. Allocation page → linia arată 220 / 0 / 220.
3. Site Manager: call-off 150 m² → Submit → rezervat (Remaining 70).
4. QS approve → Ordered 150, Remaining 70.
5. Încercare call-off 100 m² → blocat, max 70.
6. Call-off 70 m² → Remaining 0, linia se marchează "Fully ordered".
