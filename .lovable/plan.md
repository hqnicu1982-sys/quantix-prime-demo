## Goal

Close the labour loop end-to-end: rates flow into the Planner as cost estimates, and Daily Report hours are persisted and propagate into the Labour KPIs.

```text
Invite/Assign → Rate per crew → Planner task (hours × rate = cost)
                                       ↓
                            Daily Report (log hours)
                                       ↓
                              Labour KPIs (actuals)
```

## 1. Planner — cost estimates per task

**Add to `PlannerTask` (src/lib/planner.ts):**
- `plannedHours?: number` — total man-hours estimated for the task
- Helper `taskPlannedCost(task, projectId)` → `plannedHours × effectiveRate(crewId, projectId)`
- Helper `taskActualCost(task, projectId, actualHours)` for later reuse

**`NewTaskDialog.tsx`:**
- New "Planned hours" input next to crew selector
- Live cost preview: `12 h × £24.50 = £294` once both crew + hours are set

**`TaskDetailDialog.tsx`:**
- Editable Planned hours field
- New "Cost" mini-panel showing: rate (from assignment), planned hours, planned cost, actual hours logged so far (sum from daily logs), actual cost, variance
- If no crew assigned → show "Assign a crew to see cost estimate"

**Planner page KPIs (both `planner.tsx` and `projects.fitzrovia.planner.tsx`):**
- Add 5th KPI tile: "Planned labour cost" = sum of taskPlannedCost across non-done tasks

## 2. Daily Report — persistent labour log

**New module `src/lib/laborLog.ts`:**
```ts
type LaborLogEntry = {
  id: string;
  projectId: string;
  date: string;          // ISO
  memberId: string;      // refs assignment
  taskId?: string;       // optional planner task link
  hoursIn: string;       // "07:00"
  hoursOut: string;      // "16:30"
  hours: number;
  work: string;
  late?: boolean;
  createdAt: number;
};
```
- localStorage-backed, same patterns as `planner.ts` / `labour.ts`
- Hooks: `useLabourLogs(projectId, dateRange?)`, `useLabourLogsForMember(projectId, memberId)`
- Helpers: `getActualHours(projectId, memberId)`, `getActualHoursForTask(projectId, taskId)`
- Seed Fitzrovia with the existing `dailyReport.labour` mock entries so KPIs stay populated on first load

**`daily-report.tsx`:**
- Replace static `dailyReport.labour` table with live data from `useLabourLogs(currentProjectId, today)`
- Add "Log labour" button → opens `LogLabourDialog.tsx`:
  - Crew (dropdown of project assignments — re-uses `useProjectCrews`)
  - Optional task (dropdown of planner tasks)
  - In / Out times → auto-computes hours
  - Work description
- Submit persists via `addLabourLog()` and toasts confirmation
- Each row gets a delete button (Pro Control / Admin only, gated by `currentUser.tier`)

## 3. Labour KPIs — wire actuals from log

**`projects.fitzrovia.labour.tsx`:**
- Replace hardcoded `HOURS` constant with derived data:
  - `actual` = `getActualHours("fitzrovia", memberId)` (sum of all log entries to date)
  - `planned` = sum of `plannedHours` across planner tasks where `crewId === memberId`
  - `complete` = `min(100, actual / planned * 100)`
  - `variance` = `(actual - planned) / planned * 100`
- "Total hours MTD", "Labour cost", "Average rate" recompute live
- Add small "Last logged" column referencing most recent entry date

## Files

**Created:**
- `src/lib/laborLog.ts`
- `src/components/daily-report/LogLabourDialog.tsx`

**Edited:**
- `src/lib/planner.ts` — add `plannedHours`, cost helpers
- `src/components/planner/NewTaskDialog.tsx` — hours input + cost preview
- `src/components/planner/TaskDetailDialog.tsx` — cost panel + editable hours
- `src/routes/planner.tsx` + `src/routes/projects.fitzrovia.planner.tsx` — planned cost KPI
- `src/routes/daily-report.tsx` — live log table + Log Labour button
- `src/routes/projects.fitzrovia.labour.tsx` — derived actuals from log

## Out of scope (next iteration)

- Generic `projects.$projectId.*` route refactor
- Financial overview sync from invoice registry
- Approval workflow for logged hours (operative submits → foreman signs)

## Result

After approval, you'll have a closed loop: invite a member → assign with rate → plan a task with hours (sees real cost) → daily report logs hours against that crew → labour KPIs update automatically with actual cost, variance and blended rate.
