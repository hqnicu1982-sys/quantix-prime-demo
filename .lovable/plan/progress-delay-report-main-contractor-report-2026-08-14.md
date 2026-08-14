# Progress & Delay Report (Main Contractor Report)

A new "Progress log" button on the Planner opens a full report page that pulls together
everything recorded in the planner — progress, blockers, delays and user comments — and
presents it as a professional contractor-style report, exportable to PDF and Excel.

## What the user gets

1. **Button on the Planner** — "Progress log" next to Today / Export PDF, on both the
   global planner and the project planner tab. Opens `/projects/$projectId/progress-log`.

2. **Report page**, laid out like a report a main contractor would accept:
   - Header: project, contract stage, report period (default: this week, selectable
     week / 2 weeks / month / whole programme), prepared-by (current user), date.
   - Executive summary paragraph, generated automatically from the data:
     tasks complete / in progress / not started, overall % progress vs baseline,
     days ahead or behind, count of open blockers by category, and the headline
     reasons for delay.
   - **Progress table** — task, level/area, crew, planned dates, actual/current dates,
     % complete, status, variance in days.
   - **Delay register** — one row per task that slipped: task, original dates, current
     dates, days lost, cause category (material / labour / design / predecessor /
     variation / other), and the explanation taken from planner notes and comments.
   - **Blocker register** — every live blocker from the existing readiness engine
     (call-off not raised, predecessor incomplete, crew clash, variation unapproved),
     with owner and the action needed to clear it.
   - **Comment log** — chronological list of every note/comment the user recorded
     against tasks, with author and timestamp.
   - **Look-ahead** — tasks starting in the next 2 weeks and whether they are clear
     to start.
   - Free-text "Commentary / mitigation" box the user can add before exporting; it is
     saved and appears in both exports.

3. **Exports**
   - **PDF** — branded A4 document (same house style as the existing project pack):
     cover header, summary, then each register as a table, page numbers, footer.
   - **XLSX** — one workbook, tabs: Summary, Progress, Delays, Blockers, Comments,
     Look-ahead. Formatted headers, frozen top row, column widths, dates as dates,
     percentages as percentages, no formula errors.

## How the delay and comment data is produced

Today the planner stores only the current state of a task, so a slipped date leaves no
trace. To report delays truthfully the planner needs a light history:

- A **task event log** (localStorage, same pattern as the other registries) that records
  every change made through the existing task update paths: date moved, duration changed,
  progress updated, status changed, blocker noted, comment added — each with who, when,
  before/after values, and an optional reason.
- The task edit dialog and gantt drag/resize get an optional **reason** field when dates
  move, and a **comment** field so site/PM notes are captured against the task rather
  than overwriting `notes`.
- Existing seeded projects (Fitzrovia, Camden) get a realistic seeded history so the
  report is populated immediately for demos.

The "AI summary" is a deterministic narrative writer: it reads tasks, the event log, the
readiness blockers and the comments, and composes the executive summary and per-delay
explanations in plain contractor English (e.g. "Level 5 boarding slipped 4 days —
plasterboard call-off CO-248 still in draft; crew redeployed to L4"). No model call, so
it is instant, offline and always consistent with the data.

## Technical notes

- New `src/lib/progressLog.ts` — event log registry, types, and the derivation helpers
  (delay register, blocker register, period filtering, variance maths). Reuses
  `computeReadiness`, `computeKpis` and `daysBetween` from `src/lib/planner.ts`.
- New `src/lib/progressNarrative.ts` — summary/explanation text generation, unit tested.
- New route `src/routes/projects.$projectId.progress-log.tsx` plus a tab entry in the
  project layout; the global `/planner` button routes to the current project's page.
- PDF via existing `jspdf` + `jspdf-autotable`, mirroring `exportProjectPack.ts` styling
  in `src/lib/progressReportPdf.ts`.
- XLSX needs one new dependency (`exceljs`, browser-safe) in `src/lib/progressReportXlsx.ts`.
- Logging hooks added inside the existing `updateTask` / drag-resize paths in
  `src/lib/planner.ts` so nothing else has to change.
- Permissions: report visible to Admin / Pro Control only; other roles get the no-access fallback.
