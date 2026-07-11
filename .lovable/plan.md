## Problem

Când navighezi la `/team/audit`, pagina afișează conținutul de la `/team` în loc de log-ul de audit.

**Cauza:** În file-based routing TanStack, `team.tsx` + `team.audit.tsx` formează o pereche părinte/copil. `team.tsx` devine automat layout pentru `/team/audit`, dar componenta din `team.tsx` nu randează `<Outlet />` — randează întreaga pagină Team & Roles. Rezultat: ruta `/team/audit` se potrivește, dar copilul nu are unde să se monteze, iar user-ul vede vechea pagină Team.

## Fix

Redenumesc `src/routes/team.tsx` → `src/routes/team.index.tsx` și actualizez `createFileRoute("/team")` → `createFileRoute("/team/")`. Astfel:

- `/team` → `team.index.tsx` (pagina Team & Roles, neschimbată în conținut)
- `/team/audit` → `team.audit.tsx` (log-ul de audit, deja implementat)

Sunt frați sub părintele `/team` auto-generat de router — niciun fișier layout intermediar nu e necesar.

## Pași

1. `mv src/routes/team.tsx src/routes/team.index.tsx`
2. Schimb `createFileRoute("/team")` → `createFileRoute("/team/")` în `team.index.tsx`.
3. Rulez dev/typecheck și verific cu Playwright că `/team` afișează Team & Roles și `/team/audit` afișează log-ul de audit.

Nicio altă modificare — logica din `teamAudit.ts`, hookurile din `labour.ts` și butonul de link rămân cum sunt.
