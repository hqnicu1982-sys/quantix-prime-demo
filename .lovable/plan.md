## Audit — loose ends în ecosistem

Am scanat toate paginile și sursele de date. Designul UI este complet peste tot (nu mai există `StubPage` activ), dar mai sunt **6 puncte unde fluxul nu vede datele live** și **2 zone decorative** care arată bine dar nu fac nimic real.

---

### 🔴 P0 — Pagini care ignoră complet datele live ale proiectului

1. **`/projects/$id/costed-boq`** — afișează `costedBoqRows` din `mockData` în loc de `useProjectData(projectId).boqLines`. Tot ce intră prin Calculator se vede în `/costed-boq` global, dar **nu apare** în tab-ul propriu al proiectului. Lanțul Calculator → BoQ rupt aici.

2. **`/calloffs/new`** — wizard-ul cheamă `reserve()` pe `boqAllocation` și navighează spre inbox, dar **nu cheamă `addCallOff(projectId, …)`**. Deci call-off-ul nou nu apare nici în `/projects/$id/calloffs`, nici în "Drafts from Planner" pe inbox.

3. **`/calloffs/approvals`** — iterează doar `callOffs` din mock. Draft-urile generate de Planner auto-propose (scrise în `projectData.callOffs`) **nu ajung niciodată în coada QS**.

4. **`/calloffs/pipeline`** — aceeași problemă: coloanele Kanban arată doar mock, nu și call-off-urile reale.

### 🟠 P1 — Tab-uri de proiect cu carduri hardcoded peste date corecte

5. **`/projects/$id/invoices`** — primul card (`Invoice ledger`) folosește registry-ul live ✅, dar al doilea card (`Invoice reconciliation` cu PO/Invoiced/Variance) e un array hardcoded de 5 linii. Ar trebui să citească din `useInvoices(projectId)` cu join pe `matchLines` sau GRN registry.

6. **`/projects/$id/reports`** — tot array-ul de rapoarte (`DR-118`, `WR-22`…) e hardcoded. Avem deja `dailyReportSubmissions` și `getProjectVariations` care țin datele reale; tab-ul trebuie conectat la ele.

### 🟡 P2 — Zone decorative (arată bine, dar nu salvează nimic)

7. **`/price-lists/upload`** — drop zone și "Recent uploads" sunt 100% mock. Toast-ul "82 items extracted" nu persistă nimic. Fie persistăm într-un `priceListRegistry` mic, fie marcăm explicit ca demo.

8. **`/integrations`** — `useIntegrationConnections()` ține starea de conectare, dar nimic în afara paginii nu o citește (cu excepția banner-ului MSP din Planner). Statusul "Connected" e cosmetic pentru Accounting/Main contractor/Collaboration.

---

## Plan de rezolvare (recomandat: P0 + P1 într-un singur batch)

### Pas 1 — `projects.$projectId.costed-boq.tsx`
- Citește `useProjectData(projectId)`.
- Dacă `data.boqLines.length > 0`: randează tabel grupat pe sistem (material · qty · unit · supplier ales · rate dacă există), KPI-uri din `boqAllocation`.
- Dacă e gol: păstrează vederea curentă pe `costedBoqRows` ca fallback demo + banner "No BoQ yet — open Calculator to add a system".

### Pas 2 — `calloffs.new.tsx`
- După `reserve(...)`, adaugă și `addCallOff(current.id, { supplier, lineIds: [selected.id], status: "draft" })`.
- Redirect către `/calloffs/$ref` cu noul id, ca să se vadă imediat în registru.

### Pas 3 — `calloffs.approvals.tsx`
- Merge: mock `callOffs` (păstrate pentru demo Fitzrovia) + `projectData.callOffs` cu `status === "draft"` mapate ca "submitted" pentru coadă.
- Butoanele Approve/Reject scriu deopotrivă în `callOffActions` (audit) și mută statusul în `projectData.callOffs` (draft → sent).

### Pas 4 — `calloffs.pipeline.tsx`
- Adaugă mapare live: draft → coloana Draft, sent → PO sent, delivered → In delivery / Closed.
- Card-uri identice cu cele mock, link tot către `/calloffs/$ref`.

### Pas 5 — `projects.$projectId.invoices.tsx`
- Înlocuiește array-ul hardcoded cu derivare din `useInvoices(projectId)` (filter pe direction="payable") + match opțional cu `matchLines` din `invoiceWorkflow` pentru coloana variance.

### Pas 6 — `projects.$projectId.reports.tsx`
- Înlocuiește array `reports` cu un merge live din:
  - `useDailyReports(projectId)` (din `dailyReportSubmissions`)
  - `getProjectVariations(projectId)` filtrate la cele recente
- Păstrează badge-ul tip + butonul "New report".

### Verificare
- `bunx vitest run` (200+ teste actuale trebuie să rămână verzi).
- Click manual: Calculator → adaugă sistem → vezi în `/projects/$id/costed-boq` și apare în `setup checklist`.
- `/calloffs/new` → submit → vezi în `/projects/$id/calloffs` ȘI în `/calloffs/approvals` ȘI în `/calloffs/pipeline`.

---

## Întrebare

Vrei să fac **doar P0+P1** (cele 6 wiring-uri, ~1 batch de fișiere), sau și **P2** (persistăm price-lists + folosim starea integrations în tab-urile relevante)?
