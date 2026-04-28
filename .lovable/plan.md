## Cum stă acum

- `team` (în `src/lib/mockData.ts`) e o listă statică de oameni cu `role`, `tier`, `capability` — fără `rate`, fără cost real.
- `projects.fitzrovia.labour.tsx` are crew-uri hardcodate cu `rate` (£24.5, £22.0…) — nu e legat de nimeni din team.
- `Team` page are buton „Invite member" care doar dă un toast — nu persistă nimic.
- `NewTaskDialog` (planner) atașează un `crewId` din `team`, dar nu există rată → planner-ul nu poate calcula cost de labour real.

Deci „labour rate" nu există ca obiect propriu. Trebuie introdus.

## Logica propusă (3 nivele de rate)

```text
Tier 1: GLOBAL ROLE RATES   (ex: Dryliner = £24.50/h, Taper = £22/h)
        ↓ default values
Tier 2: PERSON RATE         (per membru, override pe global; ex: Marcin £26/h)
        ↓ used as default
Tier 3: PROJECT ASSIGNMENT  (membru × proiect; poate override + rol pe proiect)
```

Flow de utilizare:
1. **Settings → Labour rates** — definești rate default pe rol (Lead Dryliner, Taper, MF Fixer, Apprentice…).
2. **Team → Invite member** — dialog real: email, role (din lista de roluri), rate £/h (prefilled din role default), tier (permission).
3. **Project → Team → Assign** — alegi din directory, opțional override rate doar pe proiectul ăsta + crew name (ex: „Marcin's Crew").
4. **Planner / Labour** — task-urile cu `crewId` calculează cost = `hours × effectiveRate(person, project)`.

## Ce construim

### 1. Data layer — `src/lib/labour.ts` (nou)
- Tipuri: `LabourRole { id, name, defaultRate }`, `TeamMemberRate { memberId, rate, roleId }`, `ProjectAssignment { projectId, memberId, projectRole?, rateOverride?, crewName? }`, `Invite { email, roleId, rate, tier, status: 'pending' }`.
- Persistență `localStorage` (la fel ca `planner.ts` / `variations.ts`).
- Helpers: `effectiveRate(memberId, projectId)`, `getProjectCrews(projectId)`, `getMembersOnProject(projectId)`.
- Seed cu cele 4 crew-uri existente din labour page → devin asignări reale pe Fitzrovia.

### 2. Settings — labour rates
- Rută nouă `src/routes/settings.labour.tsx` (sau secțiune în `team.tsx`).
- Tabel editabil cu rolurile globale + rate default. Add / edit / delete role.

### 3. Invite flow real — `src/components/team/InviteMemberDialog.tsx` (nou)
- Înlocuiește toast-ul din `team.tsx`.
- Câmpuri: email, name, role (Select din `LabourRole`), rate £/h (auto-fill din role, editabil), tier (permission), proiect default (opțional).
- La submit: persist `Invite` cu status `pending`; apare în Team directory cu badge „Pending invite" și în KPI „Open invites".

### 4. Project team assign — `src/components/team/AssignToProjectDialog.tsx` (nou)
- Buton în `projects.fitzrovia.team.tsx` lângă „Invite".
- Pick member din directory + project role override + rate override + crew name.
- Apare imediat în lista „Project team" și în dropdown-ul de crew din `NewTaskDialog`.

### 5. Wire-in
- `projects.fitzrovia.labour.tsx`: înlocuiește `crews` hardcodat cu `getProjectCrews('fitzrovia')`; KPI „Average rate" devine media weighted reală.
- `NewTaskDialog`: dropdown crew din asignările proiectului (nu din `team` brut). Afișează rate lângă nume.
- `TaskDetailDialog` / `BlockersPanel`: arată cost estimat = `plannedHours × effectiveRate`.

### 6. Mici update-uri UX
- În `team.tsx`: coloană nouă „Default rate £/h" în tabel.
- KPI „Open invites" devine real (count din `Invite` cu status pending).

## Ce NU includem acum (le putem face într-o iterație separată)
- Acceptare reală a invitației prin email / auth.
- Overtime, weekend rates, cost categories (PAYE vs CIS vs sub-contractor) — putem adăuga ulterior ca câmpuri pe `LabourRole`.
- Rapoarte de cost actual din timesheets (acum doar planned cost).

## Întrebări înainte să dau drumul

Un singur lucru de confirmat: vrei **rate-urile expuse vizibil tuturor** pe pagina de team (transparent pe tot proiectul), sau **doar rolurilor Pro Control / Admin** (ascuns pentru Site User / Operative)? Dacă da-ul e „doar PM", adaug un guard simplu pe coloana de rate.