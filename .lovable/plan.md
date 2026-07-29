# Plan: Sidebar Projects — show only Active projects

## Goal
Filter the dynamic project links in the sidebar so only **Active** projects appear. Tender, Awaiting, Lost, and Complete projects should remain reachable via **All Projects** / **Tender Pipeline**, but not clutter the sidebar.

## Current state
- `src/components/AppLayout.tsx` contains `useDynamicProjectNavItems()` which builds the dynamic project list under the **Projects** sidebar group.
- It currently returns up to 4 projects from recent history or assignments, regardless of `status`.
- `ProjectStatus` is defined in `src/lib/mockData.ts` as `tender | awaiting | active | lost | complete`.
- Projects with `status: undefined` are treated as active for backward compatibility.

## Proposed change

### 1. Filter active-only in the sidebar hook
In `src/components/AppLayout.tsx`, inside `useDynamicProjectNavItems()`:
- After building `projectsById`, add a helper `isActiveProject(p: Project) => p.status === "active" || p.status === undefined`.
- Filter both `ordered` IDs and `assignedIds` through this helper before mapping to `NavItem[]`.
- Keep the cap of 4 items (only active projects count toward it).
- If the current project is not active, do **not** force-pin it to the sidebar; it should only appear if it is among the active projects.

### 2. Preserve the visual treatment
- Keep the same `HardHat` icon, active-state styling, and truncation behavior.
- No new badges or icons for this iteration; the user explicitly wants only active projects shown, not a new visual hierarchy.

### 3. Edge cases
- Empty active list: the sidebar simply shows the static project routes (All Projects, Tender Pipeline, Follow-ups) under the Projects group.
- Active projects still appear in **All Projects** and the breadcrumb project switcher unchanged.
- No changes to permissions or recent-projects tracking.

## Files to touch
- `src/components/AppLayout.tsx` — filter active projects in `useDynamicProjectNavItems()`.

## Verification
- Run `tsgo` / type check.
- Visually inspect the sidebar: only the 6 active seeded projects (Hotel Fitzrovia, Trafalgar Wharf, Bermondsey Lofts, Greenwich Peninsula, Stratford Commercial Tower, Camden Market Redevelopment) should appear; the 2 Tender and 2 Awaiting projects should not be listed.
- Confirm Tender Pipeline and All Projects still list all projects as before.
