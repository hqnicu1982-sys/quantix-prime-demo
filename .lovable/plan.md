
## Situația actuală

Tender-ul e legat de restul aplicației **doar la nivel de status**. `markActive(projectId)` (în `src/lib/projectLifecycle.ts`) face literalmente:

```
status = "active"
startDate = today
progress = 0
health = "starting"
```

Atât. Când un job e marcat câștigat:
- **Costed BoQ** nu primește nimic (rămâne pe estimate-ul din tender, fără snapshot).
- **Drawing baseline** nu se blochează — orice revizie post-award nu declanșează variații.
- **Call-off / procurement** nu se pregătește (nu apar linii sugerate, nici reservation plan).
- **Team & Roles** nu primește PM/QS default, deci audit log e gol pe kickoff.
- **Follow-ups CRM** rămâne activ pe proiect chiar dacă e Live (ar trebui să treacă în modul "delivery reminders", nu "chase quote").
- **Notificări**: nimeni din echipa de site nu află că a apărut un job nou (bell-urile nu urmăresc `status → active`).
- **Recomandat action / dashboard KPI** nu se recalculează pe granița tender→active.

Deci răspuns scurt la întrebarea ta: **nu, workflow-ul post-win nu e complet.**

## Ce propun: "Award Handoff" — un singur pas care închide bucla

O funcție nouă `awardProject(projectId, opts)` în `src/lib/projectLifecycle.ts` care înlocuiește `markActive` pentru tranziția `tender|awaiting → active` și execută atomic:

### 1. Freeze baseline comercial
- Snapshot al `contractValue`, `margin`, systems + BoQ lines în `src/lib/awardBaseline.ts` (registry nou, per project).
- De aici încolo, orice modificare la scope = **Variation** (nu edit direct pe baseline).
- Costed BoQ afișează două coloane: `Baseline @ Award` vs `Current`.

### 2. Freeze drawing baseline
- Toate reviziile marcate `isTender=true` devin **Contract Set (C0)** în `drawingRegistry`.
- Orice upload ulterior intră direct în fluxul de revision approval + banner "Impact on Variations" (deja există).

### 3. Seed procurement plan
- Din BoQ-ul înghețat generăm o listă de **Suggested Call-offs** (grupate pe supplier + system), status `draft`.
- Vizibile în tab-ul Materials cu badge "Kickoff suggestion".

### 4. Assign core team
- Dialog la award care cere PM + QS + Site Lead (default: estimatorul din tender + primii disponibili din `labour`).
- Scrie în `teamAudit` un event `project.awarded` cu snapshot rol → user.

### 5. Follow-ups: comută modul CRM
- Follow-ups pre-award (chase quote) se arhivează automat cu outcome `won`.
- Se creează 3 reminders standard: kickoff meeting (+3d), site setup review (+7d), first valuation (+30d).

### 6. Notificări
- `HeaderUrgentBell` primește un event `project.awarded` pentru PM/QS assigned.
- Recent projects list bumps proiectul.

### 7. Audit + lifecycle metadata
- `awardedDate`, `awardedBy`, `baselineSnapshotId` pe Project.
- `teamAudit` primește event `project.awarded` cu deltas.

## Structură fișiere (tehnic)

```text
src/lib/
  awardBaseline.ts         NEW — snapshot store + selectors "baseline vs current"
  projectLifecycle.ts      UPDATE — awardProject() orchestrator; markActive devine deprecated wrapper
  procurementSeed.ts       NEW — BoQ → suggested call-offs
src/components/projects/
  AwardHandoffDialog.tsx   NEW — team assignment + review snapshot înainte de confirm
  LifecycleActionDialogs.tsx  UPDATE — "Mark Active" deschide AwardHandoffDialog în loc de confirm simplu
src/routes/
  projects.$projectId.index.tsx     UPDATE — banner "Awarded on X — baseline frozen" pentru Active
  costed-boq.tsx / projects.$projectId.materials.tsx  UPDATE — coloană Baseline vs Current
```

## Ce NU intră în acest pas
- Migrare istorică a proiectelor Active deja existente (rămân fără baseline snapshot; afișăm badge "legacy").
- Integrare cu programme (MSP) — rămâne separată, doar linkăm `awardedDate` ca anchor.
- Payment schedule auto-generat — separat, după ce baseline există.

## Livrabil demo
După implementare, în UI:
1. Click **Mark Active** pe un tender → se deschide `AwardHandoffDialog` cu review.
2. Confirm → proiectul apare în tab-ul Active cu banner verde "Baseline frozen · 12 Jul 2026".
3. Tab-ul Materials arată 6 call-offs draft pre-seeded.
4. Tab-ul Variations e gol dar activ (orice edit pe scope declanșează VO).
5. Follow-ups feed marchează entry-urile pre-award ca `won` și adaugă 3 delivery reminders.
6. Bell-ul de urgent tasks arată "New project assigned: X" pentru PM.

Confirmi direcția și trecem la implementare, sau vrei să tăiem/adăugăm secțiuni (ex. skip procurement seed, sau adaugă payment schedule)?
