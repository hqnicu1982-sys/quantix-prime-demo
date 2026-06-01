## Răspuns scurt
Da, e fezabil — și avem deja toate piesele în model. Tasks în planner au `boqLineIds: string[]` (linkează direct la `ProjectBoqLine`), iar fiecare linie BoQ are `material`, `qty`, `unit`, `selectedSupplier`. Singura piesă lipsă în model este **lead time** per material/furnizor. Restul e orchestrare + un dialog de confirmare.

## Cum ar funcționa (flux utilizator)

1. Utilizatorul face MSProject import sau apasă "Pull from MSProject" (deja există via `MsProjectImportDialog` + `mspBidirectionalSync.ts`).
2. La final, în loc de toast simplu, apare un banner / pas adițional: **"X call-off-uri propuse pentru tasks nou importate"** → buton "Review proposals".
3. Se deschide un dialog **Auto-generated call-offs** care listează proposals grupate pe furnizor, fiecare cu:
   - materialele + cantitățile cumulate
   - task-urile sursă (chip-uri navigabile)
   - data țintă pentru "needed-on-site" (cea mai timpurie `task.start` între task-urile sursă)
   - data recomandată "send by" = needed-on-site − leadTimeDays − bufferDays
   - badge urgență: `overdue` / `imminent` / `ok` (verde/amber/roșu pe baza zilelor rămase)
4. Utilizatorul bifează ce vrea să accepte (sau "Accept all"), poate edita cantitatea/furnizorul/data per rând, apoi confirmă.
5. Pe confirmare se creează draft-uri în `ProjectCallOff` (status `draft`) + se actualizează `task.calloffIds` și se loghează în `auditLog`. Nu se trimit automat — rămân draft până la `Send` manual.

## Algoritm de grupare (proposal generation)

Pentru fiecare task din lista nou-importată / nou-modificată:
```text
for task in tasks:
  for lineId in task.boqLineIds:
    line = boqLines[lineId]
    if already fully covered by existing CallOffs for this line: skip
    push need { line, qty_needed, supplier: line.selectedSupplier, needed_on: task.start, source_task: task.id }

group needs by (supplier, line.id) over a coalescing window (default 5 zile):
  → 1 proposal per (supplier, batch_of_needs)
  → qty = Σ qty_needed
  → needed_on = min(needed_on)
  → send_by = needed_on − leadTime(material|supplier) − buffer
```

Coalescing-ul previne 14 call-off-uri mici către același furnizor — devine 2-3 livrări mari aliniate cu fazele.

## Ce trebuie adăugat în model

| Element | Unde | De ce |
|---|---|---|
| `leadTimeDays` per material (sau per `(supplier, material)`) | extindere în `mockData.ts` / `systemLibrary.ts` sau câmp pe `ProjectBoqLine` | Fără el nu putem calcula `send_by` realist. Default global 5 zile dacă lipsește. |
| `bufferDays` (setting de proiect) | `projectData.ts` sau `settings` | Marja de siguranță. Default 2. |
| Helper `coverageFor(lineId)` | nou `src/lib/callOffPlanning.ts` | Verifică ce cantitate e deja acoperită prin call-off-uri existente (status ≠ rejected). |
| `proposeCallOffs(projectId, taskIds?)` | același fișier nou | Pure function — fără side effects, returnează `CallOffProposal[]`. Ușor de testat cu vitest. |
| `acceptProposals(projectId, accepted, edits)` | tot acolo | Creează draft-uri în `ProjectCallOff` + leagă `task.calloffIds`. |

## UI nou (3 componente)

1. **`AutoCallOffBanner`** — în planner route, vizibil când există proposals nepublicate după ultimul import/sync. Dispare după accept sau "Dismiss".
2. **`AutoCallOffReviewDialog`** — tabelul de mai sus, cu select-all, edit inline (qty, supplier, send_by), badge urgență, link la BoQ line + task.
3. Mic indicator pe `MsProjectImportDialog` final step: "Generate X call-off proposals after import" (toggle, on by default).

## Reguli de fall-back (need handling)

- Linie fără `selectedSupplier`: proposal marcat "Needs supplier" — utilizatorul trebuie să aleagă în dialog înainte să confirme.
- Linie fără `leadTimeDays`: folosim default proiect (5z) + arătăm tag "lead time presumed".
- Task fără `boqLineIds`: ignorat — apare în secțiunea "Skipped: no BoM links" la final.
- Material deja complet acoperit: skipped, vizibil în "Skipped: already covered".

## Integrare cu prioritizarea existentă

Recommended action din `BlockersPanel` deja propune "Raise call-off" pentru blockers de tip `material`. După implementare, butonul respectiv poate redirecționa direct către `AutoCallOffReviewDialog` cu proposal-ul pre-selectat pentru task-ul curent — închidem bucla blocker → propunere → draft.

## Testabilitate

`proposeCallOffs` rămâne pură (input: tasks + boqLines + existing call-offs + assumptions; output: proposals[]). Acoperim cu vitest:
- coalescing pe fereastra de 5 zile
- skip pentru linii deja acoperite
- calcul corect al `send_by` cu/fără lead time
- urgență tier (overdue/imminent/ok)
- comportament când lipsește supplier-ul

## Ce NU rezolvăm acum (scope-out)

- Trimitere automată către furnizor (rămâne pas manual via `Send` existent).
- Optimizare per camion / minim de comandă — putem adăuga ulterior ca soft-warning.
- Re-planificare automată când task-ul se mută după acceptarea call-off-ului — afișăm doar un warning în Blockers (pattern deja existent).

## Verdict
Fezabil cu efort moderat: ~1 fișier de lib nou (`callOffPlanning.ts`) + 2 componente UI + un câmp `leadTimeDays` în BoQ/mockData + un toggle în dialogul de import. Toată logica grea e deja prezentă (task↔BoQ link, supplier choice, baseline diff din MSP). Confirmarea utilizatorului e garantată — nimic nu pleacă fără bifa lui în review dialog.
