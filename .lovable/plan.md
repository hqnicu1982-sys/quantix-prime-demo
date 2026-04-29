## Goal

Replace the hardcoded "Hotel Fitzrovia" link in the sidebar with a dynamic list of projects driven by the current user's role and assignments — mirroring the logic already used on `/projects`.

## Visibility rules

- **Admins / Pro (cap `view.financials.lite`)** — can see all projects. Sidebar shows up to 4 most-recently-visited projects under "Projects" (plus "All Projects").
- **Site Users / Operatives** — see only projects they're assigned to (via `useAssignments`). Sidebar lists ALL their assigned projects (typically 1–3).
- **Current project** is always pinned to the top of the list, even if not in recents/assignments, so the active context is never hidden.
- If the user has zero visible projects → show no project links (just "All Projects" remains for those with access; otherwise hidden).

## Recents tracking (Pro/Admin only)

- New helper `src/lib/recentProjects.ts`: small localStorage list (`qp-recent-projects`, max 8 ids, MRU order).
- Hook `useRecentProjects()` returns the list and stays reactive (custom event + storage listener, same pattern as `currentUser.ts`).
- Push the current project id into recents from `src/routes/projects.$projectId.tsx` on mount/param-change (single `useEffect`).

## Sidebar changes (`src/components/AppLayout.tsx`)

- Remove the hardcoded `Hotel Fitzrovia` entry from the `Projects` group in `navGroups`.
- Inside `SidebarContent`, after computing `visibleGroups`, inject dynamic project items into the `Projects` group:
  - Compute `visibleProjects` from `useProject().all`, `useCurrentUser()`, `useAssignments()`, and `useCan("view.financials.lite")`.
  - For Pro/Admin: take recents (filtered to existing projects), prepend current project, dedupe, slice to 4.
  - For Site/Operative: filter `all` by assignments for `me.id`, prepend current project if assigned, dedupe.
- Render each as a `NavLinkItem` with `to: "/projects/$projectId"`, `params: { projectId: p.id }`, icon `HardHat`, label = project name (truncated).
- Hide "All Projects" link for users without `view.financials.lite` if they prefer the filtered list — keep it visible for everyone but the page itself already filters (existing behaviour). Decision: keep "All Projects" visible for all (no permission gate currently, no need to add one).

## Breadcrumb cleanup

`Breadcrumb` in `AppLayout.tsx` has a hardcoded `"/projects/fitzrovia": "Hotel Fitzrovia"` entry. Remove it — the project name already renders via `ProjectSwitcher` for project routes, and project detail pages use their own breadcrumb path.

## Files touched

- `src/lib/recentProjects.ts` (new) — `pushRecentProject`, `useRecentProjects`.
- `src/components/AppLayout.tsx` — drop hardcoded link, compute & render dynamic project items, drop fitzrovia label.
- `src/routes/projects.$projectId.tsx` — call `pushRecentProject(projectId)` in a `useEffect`.

## Out of scope

- No changes to the `ProjectSwitcher` dropdown (it already lists all projects from context).
- No changes to permissions model or assignments data shape.
- Mobile bottom tab bar stays as-is (already uses `mobile: true` items, none of which are project-specific).
