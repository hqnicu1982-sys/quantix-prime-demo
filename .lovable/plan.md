
# My Assignments — pagina dedicată

## Contextul actual

Există deja `HeaderAssignmentBell` (clopoțelul albastru `UserPlus` din navbar) care citește din `myAssignmentTasks` (localStorage, scris de `awardProject()`). Dropdown-ul e util pentru „un click rapid”, dar:
- se pierde din vedere după ce închizi popover-ul,
- nu se pot vedea cele deja acknowledge-uite,
- nu se poate filtra pe rol / proiect,
- nu are acțiuni în afară de „deschide proiectul”.

## Ce construim

O rută nouă `/my-assignments` accesibilă din:
1. sidebar (grup „Personal”, sub „Follow-ups”),
2. link „See all” în footer-ul popover-ului `HeaderAssignmentBell`,
3. click pe badge-ul de count.

### Layout

```text
┌─────────────────────────────────────────────────────────────┐
│ Header: „My Assignments” + subtitle „Projects you have been │
│ staffed on — accept, review the baseline, jump in.”         │
├─────────────────────────────────────────────────────────────┤
│ KPI strip: New (unacked) · This month · As PM · As QS ·     │
│            As Site Lead · Total contract value assigned     │
├─────────────────────────────────────────────────────────────┤
│ Filter bar: [All roles ▾] [All projects ▾] [Show acked ⬜] │
│             [Mark all read]                                 │
├─────────────────────────────────────────────────────────────┤
│ Grouped list:                                               │
│  ── New (N) ───────────────────────────────                 │
│   Card per task:                                            │
│    · Project name + status pill (Active / Tender)           │
│    · Role chip (PM / QS / Site Lead)                        │
│    · Contract value · Awarded by · relativeTime             │
│    · Baseline preview: BoQ lines · Draft call-offs · Team   │
│    · Actions: [Open project] [Acknowledge] [Log first       │
│      follow-up]                                             │
│  ── Earlier this week ─────────────────────                 │
│  ── Older ────────────────────────────────                  │
├─────────────────────────────────────────────────────────────┤
│ Empty state când nu ai nimic: ilustrație + „You'll be       │
│ notified here the moment a bid you're staffed on is         │
│ awarded.”                                                   │
└─────────────────────────────────────────────────────────────┘
```

## Fișiere

1. `src/routes/my-assignments.tsx` — ruta nouă, `head()` cu titlu propriu, folosește `useMyAssignmentTasks(me.id)` + citește și cele ack-uite dintr-un helper nou.
2. `src/lib/myAssignmentTasks.ts` — extindem cu:
   - `getAllAssignmentTasks(memberId, { includeAcked })` (nu doar unacked),
   - `useAllMyAssignmentTasks(memberId, { includeAcked })`,
   - păstrăm exact același model, doar exportăm o variantă care returnează și acked.
3. `src/components/assignments/AssignmentCard.tsx` — cardul reutilizabil (folosit și dacă vrem în viitor pe dashboard).
4. `src/components/assignments/AssignmentKpis.tsx` — strip-ul cu KPI-uri.
5. `src/components/AppLayout.tsx` — intrare sidebar nouă „My Assignments” cu iconița `UserPlus` (același ca navbar-ul, pentru consistență), în același grup ca „Follow-ups”.
6. `src/components/HeaderAssignmentBell.tsx` — adăugăm în footer un link „See all assignments →” către `/my-assignments`.

## Detalii de implementare

- **Îmbogățirea cardului:** pentru fiecare task, hidratăm date live: proiectul (`useProjects`) pentru status/pill + contract value curent, `getAwardBaseline(projectId)` pentru baseline preview (BoQ count, seeded call-offs, team assignments), `useProjectFollowUps(projectId)` ca să afișăm „No follow-up yet — log kickoff”. Toate există deja.
- **Grupare temporală:** New (unacked) → This week (acked în ultimele 7 zile) → Older, sortare descrescătoare după `createdAt`/`ackAt`.
- **Log first follow-up:** deschide `LogFollowUpDialog` existent, cu `projectId` pre-selectat și tipul default „Call — kickoff”.
- **Acknowledge inline:** buton pe card care apelează `ackAssignmentTask(id)` fără a naviga.
- **Deep-link din notificări:** păstrăm click-pe-card = navighează + auto-ack (comportamentul de acum din bell).
- **Permisiuni:** vizibilă pentru toți userii logați; ecranul e per-user (`me.id`), deci nu leagă informații ale altcuiva.
- **Badge sidebar:** afișăm count-ul de unacked lângă intrarea „My Assignments” în sidebar, la fel cum face „Follow-ups”.

## Ce NU facem în această iterație

- Nu adăugăm reassign / decline (task-urile sunt informative, nu contracte de acceptare).
- Nu adăugăm push/email real — rămâne strict in-app.
- Nu construim pagină „firm-wide assignments overview” pentru admini — acest ecran e strict „ale mele”.

## Livrabile

- Rută nouă `/my-assignments` + 2 componente în `src/components/assignments/`.
- Extindere minoră `myAssignmentTasks.ts`.
- Sidebar entry + „See all” în bell.
- Type check clean.

După aprobare, execut într-un singur pas.
