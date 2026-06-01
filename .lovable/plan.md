## Verificare completă a flow-ului Daily Report → VO → Financial → Planner

Am parcurs codul nou (`RaiseVariationFromIssueDialog`, `DailyReportVoImpactCard`, `daily-report.tsx`, `variations.ts`, `planner.ts`, `BlockersPanel`). Funcționează end-to-end, dar **există 6 lacune importante** + 1 bug existent. Niciuna nu blochează demo-ul; toate sunt utile pentru a face flow-ul „production-grade".

---

### 1. Sursa unui VO este detectată prin regex pe `reason` — fragil

`DailyReportVoImpactCard` filtrează cu `/raised from daily (site )?report/i` pe text. Dacă PM-ul editează motivul când deschide VO-ul în pagina Variations, **leagătura se rupe** și cardul din Financial îl pierde.

**Fix:** adaugă pe `ProjectVariation` câmpurile `source?: "daily-report" | "manual" | "rfi"` și `sourceDate?: string` (data DR-ului). `RaiseVariationFromIssueDialog` le setează la creare; filtrarea devine `v.source === "daily-report"`. Backward-compatible (existentele rămân `manual`).

### 2. Lipsește link reverse Variation → Daily Report

În pagina Variations, când deschizi un VO „From DR", nu există un buton „Open Daily Report 2026-04-20". Util pentru audit.

**Fix:** în `VariationDetailDialog`, dacă `v.source === "daily-report"`, afișează un chip „Source: Daily Report — {sourceDate}" cu link la `/daily-report`.

### 3. Planner nu se actualizează când un VO din DR este aprobat

Tipul `PlannerTask` are deja `variationId`, iar `BlockersPanel` știe să afișeze blockers de tip `variation`. Dar **niciun task nu este creat automat** la „Raise VO", și `timeImpactDays` nu se aplică pe niciun task existent la aprobare.

Două opțiuni (recomand A — minimal invaziv):
- **A.** În dialog, opțional pickup „Link to planner task" (dropdown cu task-urile zilei). La creare, dacă e ales, setează `variationId` pe task → BlockersPanel îl evidențiază automat ca „T-… blocked by VO-… (draft)".
- **B.** Auto-creează un PlannerTask draft cu duration = `timeImpactDays` și status `scheduled`. Mai agresiv; poate genera noise pe gantt.

### 4. Cardul Financial nu separă draft / submitted / approved

Acum afișează un singur „Total cost impact". Realitatea financiară diferă: draft-urile sunt **risc**, approved-urile sunt **cost confirmat**.

**Fix:** trei KPI-uri în loc de unul:
- `Approved` (verde — cost certain),
- `Pending` (ambre — draft + submitted, „at risk"),
- `Rejected` (gri, contextual).

Aceeași clasificare există deja în `summarize()` din `variations.ts` — refolosibilă.

### 5. Lipsă gate de permisiune pe „Raise VO"

Butonul apare pentru oricine vede Daily Report (inclusiv Operative). Doar `edit.variations` ar trebui să poată ridica un VO.

**Fix:** wrap butonul în `<Gated cap="edit.variations">` în `IssuesCard`.

### 6. Lipsă notificare pentru PM când apar VO-uri noi din teren

Un draft creat de site rămâne invizibil până cineva deschide manual /variations. Pentru un workflow PM-driven, e nevoie de un semnal.

**Fix:** badge cu număr pe tab-ul „Variations" din sidebar-ul proiectului (count = draft cu `source: "daily-report"` mai noi de 24h). Alternativ: linie în `ApprovalInboxCard` pe dashboard.

---

### Bug existent (semnalat de console)

Pe `/projects/$projectId` apare în repetate rânduri `Encountered two children with the same key`. Sursele probabile (mai multe `.map` în pagina overview + child cards). Necesită o investigație scurtă cu `key` logger pentru a izola maparea exactă (lista de sisteme, health, activity, sau una din KPI strip-urile injectate). Nu blochează nimic, dar poate ascunde re-render-uri ciudate.

---

### Sugestii minor (nice-to-have, fără plan separat)

- **Bulk raise**: în Issues card, checkbox per rând + „Raise selected as one VO".
- **Rate pickup inteligent**: în loc de £45/h hardcoded pentru dayworks, ia rata efectivă a crew-ului care a logat ore în acea zi (din `laborLog` + `effectiveRate`).
- **Audit entry**: la creare VO din DR, adaugă o intrare în `dailyReportSubmissions` sau într-un viitor `auditLog` (pentru claim defence).
- **Mobile**: chip-ul „Raise VO" și textul issue-ului ar trebui să facă wrap mai elegant pe < 640px.

---

### Recomandare de prioritizare

Dacă alegi să continuăm, ordinea cu impact maxim:

1. **#1 (source field)** + **#4 (split draft/pending/approved)** — împreună, un sprint mic. Fac flow-ul corect financial și robust.
2. **#3A (link la planner task)** — închide bucla DR ↔ Planner.
3. **#5 (gate permisiuni)** — 2 linii, dar important pentru rolurile reale.
4. **#2, #6, bug** — polish.

Spune-mi care vrei să le implementăm și pornesc.