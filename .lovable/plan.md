# Planner — logica actuală și plan de îmbunătățire

## 1. Cum arată Plannerul ACUM

Există două ecrane separate, ambele 100% statice (date hardcodate, fără persistență, fără legătură reală cu restul aplicației):

**A. `/planner` — "Execution Planner" global** (`src/routes/planner.tsx`)
- Gantt vizual primitiv pe 21 zile fixe (`TOTAL_DAYS = 21`)
- Citește `ganttRows` din `mockData.ts` — array hardcodat cu `startDay`, `duration`, `progress`, `color`
- Linie "Today" lipită la `left: 0` (calcul greșit — nu reflectă data reală)
- Butoane Today / Export PDF / New task → doar `toast()`, fără efect
- Nu știe de proiectul curent, nu reacționează la persona

**B. `/projects/fitzrovia/planner` — tab pe proiect** (`src/routes/projects.fitzrovia.planner.tsx`)
- Array local `tasks` cu 6 rânduri hardcodate (text "08 Apr → 24 Apr", nu Date reale)
- 4 KPI-uri (Programme status, Active, Crews, Blocked) — toate strings statice
- Tabel simplu cu progress bar; status colorat
- Zero interacțiune: nu poți adăuga / muta / edita

**Ce LIPSEȘTE complet din logică:**
- Nicio sursă reală de date (nu există `src/lib/planner.ts`, nu se folosește `localStorage`)
- Niciun link cu BoQ (taskurile ar trebui să consume linii de scope)
- Nicio legătură cu Call-offs (un task n-ar trebui să poată începe fără materialul livrat)
- Nicio legătură cu Variations (VO aprobate ar trebui să adauge / decală taskuri)
- Nicio legătură cu Labour (crew-urile sunt strings, nu IDs din `team`)
- Fără dependențe între taskuri (FS, SS), fără calcul de critical path
- Fără reactivitate la date reale (today line e fake)

## 2. Plan de îmbunătățire — 3 etape

### Etapa 1 — Fundație: model de date real + persistență

Creez `src/lib/planner.ts` cu pattern identic `variations.ts` / `projectData.ts`:

```ts
PlannerTask {
  id: "T-001"
  projectId
  title, level, area
  crewId           // referință la team[].id (nu mai e string liber)
  start: ISO date  // Date real, nu "08 Apr"
  end: ISO date
  progress: 0-100
  status: "scheduled" | "starting" | "on-track" | "behind" | "blocked" | "done"
  
  // legături reale
  boqLineIds: string[]          // scope din costed BoQ
  calloffIds: string[]          // materiale necesare
  variationId?: string          // dacă a venit dintr-un VO aprobat
  dependsOn: string[]           // alte task IDs (FS dependency)
  
  blockers: { type: "material"|"labour"|"design"|"sub", note: string }[]
}
```

Storage: `localStorage` cheie `qp-planner-{projectId}` + `CustomEvent` pentru reactivitate.

API: `useProjectTasks(projectId)`, `addTask`, `updateTask`, `moveTask(id, deltaDays)`, `setProgress`, `computeKpis(tasks)` (programme variance, active count, blocked count, crews on site).

Seed: convertesc cele 6 taskuri demo Fitzrovia + 14 din `ganttRows` în formatul nou, cu Date reale (ancora = 28 Apr 2026 = data curentă din header).

### Etapa 2 — Gantt interactiv real

Creez `src/components/planner/GanttChart.tsx`:
- Scală timp **dinamică** (zoom: zi / săptămână / lună), nu mai hardcodată la 21
- Linie "Today" calculată din `new Date()`, plasată corect pe axă
- Bare cu **drag-to-move** și **resize** edge (mouse handlers, fără bibliotecă)
- Linii subțiri pentru **dependențe** (FS arrow între task end → task start)
- Click pe bară → `TaskDetailDialog` cu toate câmpurile + blockers + linkuri către BoQ / Call-off / VO source
- Highlight visual pentru **critical path** (taskuri unde slack = 0)
- Filtre: by crew, by level, by status, by source (baseline / VO)

Înlocuiește atât tabelul Fitzrovia cât și gantt-ul global; ruta `/planner` devine vedere multi-proiect (toggle proiect curent).

### Etapa 3 — Constraint-awareness (USP-ul real)

Asta diferențiază Plannerul de un Gantt generic Excel. Adaug în `planner.ts` o funcție `computeReadiness(task, project)`:

```text
Pentru fiecare task, verifică:
1. Material gate     → toate calloffIds au status = "delivered" înainte de task.start?
2. Labour gate       → crewId e disponibil în fereastra start→end? (cross-check cu alte taskuri)
3. Predecessor gate  → toate dependsOn au progress = 100?
4. VO gate           → dacă variationId există, statusul VO = "approved"?

Returnează: { ready: bool, blockers: [...], suggestedStart: Date }
```

Integrare UI:
- **Badge "Not ready"** pe bara taskului dacă vreun gate pică
- **KPI "Ready to start this week"** = câte taskuri din look-ahead 7 zile au gate-uri OK
- **Panou "Blockers"** sub Gantt: listă consolidată cu link direct (ex. "T-105 blocked: PO-2026-031 not yet ordered → New call-off")
- **Auto-suggest reschedule**: buton "Push to ready date" care apelează `moveTask` cu `suggestedStart`
- **Look-ahead 3-week view**: tab dedicat care arată doar taskurile din fereastra curentă + 21 zile, sortate după ready/blocked

## 3. Modificări de fișiere

**Create:**
- `src/lib/planner.ts` (model + hooks + seed + readiness logic)
- `src/components/planner/GanttChart.tsx` (canvas/SVG-based, drag&drop)
- `src/components/planner/TaskDetailDialog.tsx`
- `src/components/planner/NewTaskDialog.tsx` (cu picker pentru BoQ lines, crew, dependsOn)
- `src/components/planner/BlockersPanel.tsx`
- `src/components/planner/LookAheadView.tsx`

**Edit:**
- `src/routes/planner.tsx` — devine vedere multi-proiect cu toggle, folosește `GanttChart` real
- `src/routes/projects.fitzrovia.planner.tsx` — KPI-uri din `computeKpis()`, înlocuiește tabelul cu `GanttChart` + `BlockersPanel` + tab `LookAheadView`
- `src/lib/mockData.ts` — păstrez `ganttRows` ca seed legacy, dar adaug `plannerSeed` în formatul nou

**Tot pe `localStorage`, fără Cloud.** Pot livra etapele incremental — confirmă dacă mergem direct cu toate 3 sau doar cu Etapa 1+2 (fundație + Gantt) și lăsăm constraint-awareness într-o iterație separată.
