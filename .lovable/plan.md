## Goal

Extind sistemul de drawing revisions de la "upload + approve + compare" la un **registru complet integrat în workflow-ul Quantix**: notificări, link cu BoQ/call-offs, semnale către operative, bulk upload, audit, export, unlock controlat. Tot ce am enumerat (critic → nice-to-have) intră în acest plan, ordonat pe priorități și grupat în file changes mici.

## A. Extensii la modelul de date (`src/lib/drawingRegistry.ts`)

Adaug pe `DrawingRevision`:
```ts
affectedSystemIds?: string[];   // link → ProjectSystem.id (dropdown la upload)
affectedBoqLineIds?: string[];  // link → ProjectBoqLine.id
withdrawnAt?: number;           // pentru "retract before approval"
withdrawnBy?: string;
```
Status nou: `"withdrawn"` adăugat la `DrawingRevisionStatus`.

Pe `DrawingsState`:
```ts
auditLog: DrawingAuditEntry[];  // append-only
tenderUnlockedAt?: number;      // dacă a fost vreodată unlock-uit
tenderUnlockHistory?: { at: number; by: string; reason: string }[];
```

`DrawingAuditEntry`:
```ts
type DrawingAuditKind = "upload" | "approve" | "reject" | "withdraw" | "supersede"
                     | "lock-tender" | "unlock-tender" | "delete" | "bulk-upload";
type DrawingAuditEntry = {
  id: string; ts: number; actor: string; kind: DrawingAuditKind;
  drawingNumber?: string; revisionCode?: string; revisionId?: string;
  detail?: string;
};
```

API nou:
- `withdrawRevision(projectId, revId, actor)` — doar uploaderul propriu, doar dacă `status === "pending"`.
- `unlockTender(projectId, actor, reason)` — gated `lock.tender`, cere reason, scrie în `tenderUnlockHistory`.
- `bulkAddRevisions(projectId, inputs[])` — atomic, returnează `{ ok, added, errors[] }`.
- `getDrawingAudit(projectId)` + `useDrawingAudit(projectId)`.
- `getImpactedDrawings(projectId, { systemId?, boqLineId? })` — folosit din BoQ/call-offs ca să arătăm „acest BoQ are 2 revizii pending".
- Validare suplimentară în `addRevision`: rejectează dacă `drawingNumber+revisionCode` deja există (deja are guard, păstrăm); rejectează `revisionCode` cu chars în afara `[A-Z0-9]`.

Toate mutațiile actuale (`addRevision`, `approveRevision`, `rejectRevision`, `removeRevision`, `issueTenderSet`, plus cele noi) push într-un `auditLog` entry.

Teste noi în `drawingRegistry.test.ts`: withdraw flow, unlock + reissue, bulk upload (partial failure), impact selectors, audit append.

## B. Permissions (`src/lib/permissions.ts`)

Adaug:
- `unlock.tender` → **doar Admin** (separat de `lock.tender` pentru audit clarity).
- `withdraw.drawings.own` → Pro, Pro Control, Admin.
- `bulk.upload.drawings` → Pro, Pro Control, Admin.
- `export.drawings.register` → toți cu `view.calloffs` sau mai sus (e read-only).

## C. Componente UI noi

### 1. Notificări → în `ApprovalInboxCard` (item #1 critic)
Modific `src/components/dashboard/ApprovalInboxCard.tsx`:
- Adaug secțiune nouă „Drawing revisions to review" gated pe `approve.drawings`, count = `pendingCount`, link → `/projects/$projectId/specification#drawing-revisions`.

### 2. Superseded badge / „nu mai folosi" (item #3 critic)
- În `DrawingRevisionsCard`: când istoric e expand-at, `superseded` revizii primesc deja badge — adaug ribbon roșu „SUPERSEDED — current is C2" + tooltip explicativ.
- La download: dacă rev e `superseded`, intercept click, deschide confirm dialog „You're downloading a superseded revision. Current is C2 (02 Jun). Continue?".

### 3. Link BoQ ↔ Drawing (item #2 critic)
- În `UploadDrawingRevisionDialog.tsx`: două multi-select dropdowns noi „Affected systems" (din `useProjectData(projectId).systems`) și „Affected BoQ lines" (filtrate pe sisteme selectate). Doar pentru revizii post-tender.
- Card nou `DrawingImpactCard.tsx` afișat în `/variations` și în `/costed-boq`:
  ```
  ⚠ 2 pending drawing revisions affect priced scope
  · A-201 C1 → System "Acoustic walls L4" · £12,400 exposure
  · M-110 C2 → System "MEP risers" · £3,800 exposure
  [Review revisions]
  ```
  Exposure = sum(`qty * ratePerUnit`) al BoQ lines impactate. Reads via `getImpactedDrawings`.

### 4. Audit log per drawing (item #6)
- Tab nou în Specification: sub `DrawingRevisionsCard`, accordion „Drawing audit log" (collapsed default). Pattern copiat din `invoices.audit.tsx`.
- Filtru per drawing-number; export CSV.

### 5. Bulk upload (item #4)
- Buton secundar în header card-ului „Bulk upload" (gated `bulk.upload.drawings`).
- Dialog `BulkUploadDrawingsDialog.tsx`: drag-drop multiplu, parse file names cu regex `^([A-Z]{1,3}-\d{2,4}[A-Z]?)[ _-]+(T\d+|C\d+|P\d+)\.(pdf|dwg|png|jpg)$`. Fișiere care nu matchează regex apar în secțiune „Needs manual mapping" cu input-uri inline pentru drawingNumber + revisionCode + discipline.
- Pre-tender: toate intră ca `isTender=true`. Post-tender: ca `pending` cu prompt pentru change notes global.
- Submit → `bulkAddRevisions`, raport „24 added · 2 duplicates skipped".

### 6. Drawing register export (item #5)
- Buton „Export register" în header card.
- Generează CSV: `drawingNumber, title, discipline, currentRevision, tenderRevision, status, lastUpload, uploadedBy, notes, affectedSystems`.
- Fără PDF export deocamdată (out of scope) — semnalat că poate fi adăugat după.

### 7. „Latest only" toggle (item #7)
- În header card, switch „Hide history" (default ON pentru Site/Operative, OFF pentru Pro+).
- Când ON: ascunde rândurile expand-ate, afișează doar reviziile `current`.

### 8. Multi-discipline filter (item #10)
- Strip cu chips deasupra listei: `All · Architect · Structural · MEP · Fire · Other`. Filtrare client-side.

### 9. Withdraw revision (edge case)
- În UI per-revizie: buton `Withdraw` vizibil DOAR pentru `uploadedBy === me.name && status === "pending"`. Confirm dialog, fără reason.

### 10. Tender re-issue / unlock (edge case)
- În banner-ul verde „Tender baseline frozen": apare buton mic `Unlock` (gated `unlock.tender`).
- Dialog `UnlockTenderDialog.tsx`: textarea reason obligatorie + warning roșu „This invalidates all pending comparisons. Use only when the client re-issues the tender set."
- După unlock: bannerul devine portocaliu „Tender unlocked 18 Jun by Admin · reason: client re-issued package B" și butonul `Issue tender set` reapare.
- `tenderUnlockHistory` afișat în audit log.

### 11. Validări existente
- Unicitate `drawingNumber + revisionCode` (deja are guard în registru — adaug test explicit).
- Mesaj toast: „A-201 C1 already exists — use a new revision code".

### 12. Mobile-friendly compare (item #11)
- În `DrawingCompareDialog.tsx`: pe viewport <768px (use `useIsMobile`), trec layoutul din side-by-side în tabs (`Tender` / `Revision`), păstrând zoom controls.

## D. Conexiuni în workflow (cross-module)

Acesta e jumătatea care lipsea — drawing registry devine o sursă consumată în alte module.

### 1. **Variations** (`projects.$projectId.variations.tsx`)
- Înlocuiesc banner-ul actual cu `<DrawingImpactCard projectId={…} mode="variations" />`.
- În dialog-ul „New variation": câmp opțional „Triggered by drawing revision" cu autocomplete peste reviziile `pending`/`current` post-tender. Salvat ca metadata pe variation (extind `Variation` type cu `triggeredByRevisionId?: string`).
- VariationDetail arată back-link spre revizie + buton „Open compare".

### 2. **Call-offs** (`calloffs.new.tsx` + `calloffs.$ref.tsx`)
- În wizard, când utilizatorul selectează BoQ lines: dacă o linie selectată e legată de o revizie `pending` (via `affectedBoqLineIds`), warning inline „A-201 C1 pending review may change this BoQ — confirm before sending PO".
- Pe pagina call-off existentă: badge „Based on drawing rev T1" (snapshot la momentul creării).

### 3. **Costed BoQ** (`projects.$projectId.costed-boq.tsx`)
- Coloană nouă (sau iconiță) per row: dacă `boqLine.id ∈ affectedBoqLineIds` al unei revizii `pending` → iconiță `GitCompare` portocalie cu tooltip „Pending revision: A-201 C1".

### 4. **Planner** (`projects.$projectId.planner.tsx`)
- Task-uri legate de un sistem care are revizii pending: badge mic „rev pending" pe bara Gantt + în tooltip.
- Soft integration — citește `getImpactedDrawings` per task.systemId.

### 5. **Daily report** (`forms.daily-report.tsx`)
- În secțiunea „Issues raised": câmp opțional „Reference drawing" (autocomplete drawingNumber + revisionCode). Util când operativul flag-uiește o diferență față de desen.

### 6. **Project KPI strip** (Specification + Project home)
- Update `projects.$projectId.specification.tsx` KPI „Drawing revisions" să arate `X total · Y pending · Z affecting BoQ`.
- În `projects.$projectId.index.tsx` (project home): mic widget „Drawings" cu același rezumat + link.

### 7. **Audit log global**
- `invoices.audit.tsx` rămâne separat. NU contopesc — drawing audit are scope diferit. Doar adaug link la cross-nav.

## E. Seed extension (proiect `camden`)

- Adaug 2 audit entries istorice (issue tender + 2 upload-uri pending).
- Leg revizia `A-201 C1` la sistemul „Acoustic walls L4" (primul system din seed).
- Leg `M-110 C2` la sistemul MEP.
- Adaug 1 revizie `withdrawn` ca demo pentru flow-ul withdraw.
- NU adaug bulk upload sau unlock — acestea se demo-iesc live.

## F. Files

**New:**
- `src/components/specification/BulkUploadDrawingsDialog.tsx`
- `src/components/specification/UnlockTenderDialog.tsx`
- `src/components/specification/DrawingAuditLog.tsx`
- `src/components/specification/DrawingImpactCard.tsx`
- `src/lib/drawingExport.ts` (CSV generator)

**Modified:**
- `src/lib/drawingRegistry.ts` (audit, withdraw, unlock, bulk, impact selectors, links)
- `src/lib/drawingRegistry.test.ts` (new tests)
- `src/lib/permissions.ts` (3 new caps)
- `src/lib/variations.ts` (add `triggeredByRevisionId`)
- `src/components/specification/DrawingRevisionsCard.tsx` (filters, latest-only, withdraw, unlock banner, superseded ribbon, intercept download, audit toggle, export button, bulk button)
- `src/components/specification/UploadDrawingRevisionDialog.tsx` (affected systems/lines selects)
- `src/components/specification/DrawingCompareDialog.tsx` (mobile tabs)
- `src/components/dashboard/ApprovalInboxCard.tsx` (drawings section)
- `src/components/variations/NewVariationDialog.tsx` (triggered-by select)
- `src/components/variations/VariationDetailDialog.tsx` (back-link)
- `src/routes/projects.$projectId.variations.tsx` (impact card)
- `src/routes/projects.$projectId.costed-boq.tsx` (pending icon column)
- `src/routes/projects.$projectId.specification.tsx` (KPI update + audit accordion)
- `src/routes/projects.$projectId.index.tsx` (mini widget)
- `src/routes/projects.$projectId.planner.tsx` (rev-pending badge)
- `src/routes/calloffs.new.tsx` (BoQ warning)
- `src/routes/calloffs.$ref.tsx` (drawing-rev snapshot badge)
- `src/routes/forms.daily-report.tsx` (drawing reference field)
- `quantix_lovable_full_inventory.md` (update Drawings registry section)

## G. Out of scope (explicit)

- PDF overlay diff (vizual auto-diff) — rămâne manual side-by-side.
- Cross-project drawing library (shared între proiecte).
- Email/push notifications reale — doar in-app inbox.
- PDF export al registrului — doar CSV.
- Thumbnail generation pentru drawings.
- OCR pe revision clouds.
- Realtime collaboration / locking pe drawing.

## H. Verificare

- `bunx vitest run` — toate testele noi + cele 94 existente.
- Manual smoke: upload → pending → approve → check că Variations + Costed BoQ + ApprovalInbox afișează corect; unlock → reissue; bulk upload cu 1 fișier malformat.
