
# Sincronizare MSProject pe tot proiectul + upload program în orice format

Obiectiv: când Quantix e conectat la MSProject (sau utilizatorul încarcă un fișier de planificare), întregul planner al proiectului se populează automat, iar Profit Forecast generează imediat o estimare bazată pe durata și încărcarea taskurilor — fără să fie necesară alocarea manuală a resurselor.

## 1. Modele de conexiune (3 surse, același output)

Toate sursele produc același `MspBundle` (`MspTaskRow[]`) — restul aplicației rămâne neschimbată.

**A. Conector live MSProject / Project for the Web**
- Buton "Connect MSProject" în pagina Integrations (există deja card-ul) → folosește pattern-ul `connectIntegration()` din `src/lib/integrationConnections.ts`.
- Conectorul real (Microsoft Graph / Project API) e out-of-scope pentru sandbox — păstrăm simularea, dar adăugăm flag `isLive` pe conexiune și un buton "Sync now" care re-rulează `simulateMspBundle()` și marchează `lastSync`.
- Când conexiunea există și e `isLive`, planner-ul afișează un banner "Synced from MSProject · last sync 12m ago · Sync now".

**B. Upload fișier (nou)**
Dialog nou `UploadProgrammeDialog` accesibil din Planner (header) și din wizard-ul MSP. Acceptă:
- `.xml` (MS Project XML export) — parser nativ cu `DOMParser`, mapează `<Task>` → `MspTaskRow`.
- `.csv` / `.xlsx` — coloane minime: `Name`, `Start`, `Finish`, `Duration`, `Work`, `Resource`. Folosim `papaparse` pentru CSV; xlsx via `xlsx` npm package.
- `.pdf` — extract text via `pdfjs-dist` (deja edge-compatible), apoi heuristic table parser (header row detection + column ranges). Pentru PDF-uri scanate afișăm mesaj "PDF text not readable — try XML/CSV export".
- `.mpp` — nu se poate parsa în Worker; afișăm UI care explică și sugerează export `.xml` din MSProject (File → Save As → XML).

Toate parserele rulează în server function `parseProgrammeFile` (`src/lib/programmeImport.functions.ts`) care primește FormData și returnează `MspBundle`.

**C. Simularea existentă** rămâne ca fallback "Load sample programme" în dialog.

## 2. Sync pe tot proiectul (one-click)

Înlocuim wizardul cu mapping per-rând cu un flow simplificat:
- Preview: numărul de taskuri, durata totală, perioada, ore totale.
- Toggle "Replace existing planner" vs "Merge (fuzzy match)".
- Apply → bulk create/update prin store-ul planner-ului, păstrând `crewId`/`workHours` deja alocate pe taskurile match-uite.
- Confirmare: "47 tasks synced · Profit Forecast updated · open Financial".

Mapping-ul fin per-rând rămâne disponibil printr-un buton "Advanced mapping" pentru utilizatorii care vor control.

## 3. Estimare profit din programul sincronizat (fără alocare)

Extindem `computeProfitForecastFromInputs` din `src/lib/profitForecast.ts` cu o sursă nouă de baseline când task-urile vin din sync:

- Pentru fiecare task fără `crewId`, folosim `workHours` din MSP (mai precis decât heuristica `days × 8h × crew_size`) × `DEFAULT_LABOUR_RATE`. Dacă `workHours` lipsește, cădem pe heuristica existentă.
- Nouă funcție `estimateLabourFromProgramme(tasks)` care întoarce `{ labourEstimated, breakdown }` pe baza orelor MSP.
- `confidence` urcă față de baseline-ul fără sync (avem date concrete despre durată/ore), dar rămâne sub varianta cu crew-uri alocate. Adăugăm la `drivers`: "Sincronizat din MSProject — alocă crew-uri pentru lock-in".
- `ProfitForecastCard` afișează un badge "Programme-based estimate · X tasks synced".

## 4. UI changes

- `src/components/planner/MsProjectImportDialog.tsx` → refactor: 3 taburi (Live sync / Upload file / Sample), preview compact, "Apply to project" buton mare.
- `src/components/planner/UploadProgrammeDropzone.tsx` (nou) — drag&drop multi-format cu icon-uri și hint pentru `.mpp`.
- `src/routes/planner.tsx` + `projects.$projectId.planner.tsx` → banner "Synced from MSProject · last sync … · Sync now / Re-import".
- `src/components/financial/ProfitForecastCard.tsx` → badge "From programme" + link "View programme".
- `src/routes/integrations.tsx` → card MSProject capătă status real din `useIntegrationConnection("msproject")`.

## 5. Fișiere noi / modificate

**Noi**
- `src/lib/programmeImport.functions.ts` — server fn `parseProgrammeFile` (XML/CSV/XLSX/PDF → `MspBundle`).
- `src/lib/programmeParsers/` — `xml.ts`, `csv.ts`, `xlsx.ts`, `pdf.ts`.
- `src/components/planner/UploadProgrammeDropzone.tsx`.
- `src/components/planner/ProgrammeSyncBanner.tsx`.

**Modificate**
- `src/lib/msProjectImport.ts` — exportă `applyBundleToProject(bundle, mode: "replace"|"merge")`.
- `src/lib/profitForecast.ts` — `estimateLabourFromProgramme`, folosește `workHours` când există.
- `src/components/planner/MsProjectImportDialog.tsx` — tabs + flow simplificat.
- `src/components/financial/ProfitForecastCard.tsx` — badge sursa programului.
- `src/routes/planner.tsx`, `src/routes/projects.$projectId.planner.tsx` — banner sync.
- `src/routes/integrations.tsx` — status live MSProject.

## 6. Detalii tehnice

- `pdfjs-dist` și `xlsx` se adaugă cu `bun add`. `papaparse` probabil deja în deps; verific.
- Parser PDF heuristic: extragem text pe pagină, detectăm linia cu coloane (`Task Name`, `Start`, `Finish`, `Duration`, `Work`), apoi împărțim fiecare linie pe baza pozițiilor X ale headerelor. Acceptăm output imperfect și marcăm rândurile cu `confidence < 0.6` ca "Review needed" în preview.
- Toate parserele întorc același shape; UI nu știe ce format a fost încărcat.
- Server fn pentru PDF/XLSX (nu rulează în browser bundle). XML/CSV pot rula și client-side ca fallback.

## Out of scope (faza următoare)
- Sync bidirecțional Quantix → MSProject.
- Parser real `.mpp` (necesită serviciu Java extern).
- OAuth real Microsoft Graph (rămâne simulat în acest milestone).
