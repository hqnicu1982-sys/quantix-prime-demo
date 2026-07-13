## Scope

Extindem sistemul de follow-up dincolo de tender-drawer, ca "CRM light" pentru toată etapa comercială (tender + awaiting + active). Toate cele 4 îmbunătățiri într-un singur pas.

## 1. Reminder auto după log

La salvarea unui follow-up manual, propunem automat `nextReminderDate` pe baza `outcome`:

| Outcome              | Offset sugerat |
|----------------------|----------------|
| no-response          | +3 zile        |
| acknowledged         | +5 zile        |
| pricing-review       | +7 zile        |
| decision-pending     | +2 zile        |
| won / lost           | fără reminder  |

- În `LogFollowUpDialog` adăugăm un câmp "Next follow-up" cu date-picker pre-completat (poate fi șters).
- La salvare, pe lângă `logFollowUp`, apelăm un helper nou `setFollowUpReminder(projectId, date)` care actualizează `project.followUpReminderDate` via `customProjects` (există deja patch logic).
- Pentru proiecte active (fără câmp existent pe `Project`), salvăm reminder-ul în același `ManualFollowUp` registry sub un flag `isNextReminder` — pipeline-ul îl citește pentru badge "overdue".

## 2. Edit / delete pe entry manual

- Adăugăm meniu `⋯` (DropdownMenu) doar pe entries cu `manual: true`.
- Acțiuni: **Edit** (redeschide `LogFollowUpDialog` prepopulat) și **Delete** (confirm inline).
- Extindem `tenderDetails.ts` cu `updateFollowUp(id, patch)` și `deleteFollowUp(id)`.
- Entries derivate (tender invite, quote sent) rămân imutabile — nu primesc meniu.

## 3. Outcome → lifecycle action

- La salvare, dacă `outcome === "won"` sau `"lost"` **și** proiectul e în stage `tender`/`awaiting`, dialogul afișează un banner: *"Marchezi acest tender ca Won/Lost? [Confirmă] [Doar log]"*.
- Confirmă → apelăm `markActive({ contractValue })` sau `markLost({ reason: outcome-note })` din `projectLifecycle.ts` (există deja).
- Fluxul rămâne opțional: user-ul poate doar loga fără tranziție.

## 4. Follow-up feed cross-project

Pagină nouă **`/follow-ups`** (rută separată, nu tab), accesibilă din sidebar sub "Tender Pipeline":

- **KPI strip**: Total logged (7d/30d), Overdue reminders, By channel (email/call/meeting counts).
- **Tabel unificat** cu toate follow-up-urile (manuale + derivate din quote sent), sortate desc după dată. Coloane: Data · Proiect (+ stage badge) · Canal · By · Note (truncat) · Outcome · Next reminder.
- **Filtre**: Stage (tender/awaiting/active/all), Owner (estimator), Channel, Date range (7d/30d/90d/custom), Outcome.
- **Row click** → deschide `TenderDetailSheet` pentru proiecte tender/awaiting, sau navighează la `/projects/$id` pentru active.
- **Export CSV** button (pattern-ul existent din `team.audit.tsx`).

## 5. Extindere la Active projects

- `TenderDetailSheet` rămâne pentru tender/awaiting. Pentru **active projects**, adăugăm o secțiune "Client follow-ups" în tab-ul **Overview** al proiectului (`projects.$projectId.index.tsx`) — aceeași listă + buton "Log follow-up" folosind aceleași primitive (`useManualFollowUps`, `LogFollowUpDialog`).
- Outcome list ajustată contextual pentru active: `informed`, `waiting-approval`, `escalated`, `resolved` (în plus față de outcome-urile de tender). Extindem `FOLLOW_UP_OUTCOMES` cu un `stage: "pre" | "post" | "any"` și filtrăm în UI.
- Feed-ul cross-project (`/follow-ups`) include automat și active projects.

## Fișiere afectate

**Modificate:**
- `src/lib/tenderDetails.ts` — `updateFollowUp`, `deleteFollowUp`, `computeNextReminderOffset`, extindere `FOLLOW_UP_OUTCOMES` cu `stage`, `nextReminderDate` pe `ManualFollowUp`.
- `src/lib/customProjects.ts` — helper `setFollowUpReminder` (dacă nu există deja un patch generic).
- `src/components/projects/TenderDetailSheet.tsx` — câmp Next reminder în dialog, meniu edit/delete, banner outcome→lifecycle, modul edit al dialogului.
- `src/components/AppLayout.tsx` — link sidebar "Follow-ups" sub Tender Pipeline.
- `src/routes/projects.$projectId.index.tsx` — card "Client follow-ups" pe tab Overview pentru active.

**Noi:**
- `src/routes/follow-ups.tsx` — pagina cross-project cu KPI, filtre, tabel, export.
- `src/components/projects/FollowUpsCard.tsx` — componentă reutilizabilă (listă + log button), folosită în sheet și în Overview tab, pentru a evita duplicarea JSX-ului.

## Ce NU face acest plan

- Nu adaugă email sending real (butonul "Log follow-up" rămâne evidență manuală, nu trimite mail).
- Nu adaugă notificări push / in-app pentru reminder-uri overdue (rămân doar badge-uri vizuale).
- Nu modifică structura `Project` type (folosim registry-ul localStorage existent).
