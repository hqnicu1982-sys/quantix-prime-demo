
# Ghid pas-cu-pas pentru Planner (în UI)

Adaug un ghid contextual în Planner — pattern identic cu `IntegrationsHowTo` (collapsible, dismiss persistent în localStorage) — care explică cele 3 căi de a popula plannerul (manual, drag-drop pe Gantt, import program) și leagă fiecare pas către ecranul relevant.

## Ce construiesc

**Component nou:** `src/components/planner/PlannerHowTo.tsx`
- Card collapsible, dismiss persistent în `localStorage` sub cheia `qp-planner-howto`
- Header: „Cum funcționează Execution Planner" + buton „Hide guide" / re-show pill
- 3 secțiuni vizuale (taburi sau coloane), una per cale de input
- Footer cu pașii post-import (alocare crew, blockers, profit forecast)

**Plasament:** în ambele rute de planner, deasupra strip-ului de KPI-uri:
- `src/routes/planner.tsx` — sub `<ProjectBanner />`, înainte de `<MspSyncBanner />`
- `src/routes/projects.$projectId.planner.tsx` — înainte de `<MspSyncBanner />`

## Structura ghidului

**Secțiunea 1 — Adaugă taskuri manual**
1. Apasă `+ New task` (header Planner) → titlu, dată start/end, ore planificate
2. Asignează un crew din lista de echipe → leagă către `/settings/labour` („Setează ratele crew")
3. (Opțional) Leagă linii BoQ pentru readiness pe materiale → link `/projects/$pid/costed-boq`

**Secțiunea 2 — Drag & drop pe Gantt**
1. Trage corpul barei pentru a muta task-ul
2. Trage marginile pentru a redimensiona (modifică `plannedHours` proporțional)
3. Click pe bară → `TaskDetailDialog` pentru progres, dependențe, blockers
4. Toggle zoom day/week/month din header

**Secțiunea 3 — Import program (MSProject / fișier)**
1. Apasă `Import MSP` din header → dialog `MsProjectImportDialog`
2. Alege sursa: live sync, upload `.xml` / `.csv` / `.pdf`, sau sample
3. Mod: `Merge` (păstrează crew + call-offs existente) sau `Replace`
4. Apply → tasks populate `plannedHours`; banner „Synced from MSProject" apare sus
5. Link către ghidul integrărilor: `/integrations` (pentru a conecta MSProject live)

**Footer — După import**
- Alocă crew pe taskuri → `labourEstimated` migrează în `labourPlanned`, confidence ↑
- Vezi blockers (material, predecesor, double-booking, variation) în panoul de jos
- Verifică impactul în Profit Forecast → link `/projects/$pid` (tab Financial) sau `/financial`
- Push schimbări înapoi în MSProject prin `MspSyncBanner` (când există pending)

## Detalii tehnice

- Refolosesc shape-ul din `IntegrationsHowTo.tsx`: `Card` + `CardHead`, iconițe `lucide-react` (`MousePointerClick`, `Move`, `Upload`, `Users`, `AlertTriangle`, `TrendingUp`), `ChevronUp/Down`, `X`.
- Linkuri: `<Link>` din `@tanstack/react-router` cu `to` type-safe; pentru rutele scoped pe proiect folosesc `params={{ projectId: PID }}`.
- State persistat: același pattern `load()` / `save()` cu `localStorage` ca în `IntegrationsHowTo`.
- Pe ruta globală `/planner` linkurile către ecrane per-proiect folosesc `current.id` din `useProject()`.
- Zero modificări de business logic; este pur prezentare.

## Fișiere

**Noi**
- `src/components/planner/PlannerHowTo.tsx`

**Modificate**
- `src/routes/planner.tsx` — adaug `<PlannerHowTo />` sub ProjectBanner
- `src/routes/projects.$projectId.planner.tsx` — adaug `<PlannerHowTo projectId={PID} />` în top

## Out of scope
- Tooltip-uri inline pe Gantt / butoane (rămâne pentru un milestone separat „interactive tour")
- Versiune i18n (textul rămâne în română, ca restul UI-ului recent)
