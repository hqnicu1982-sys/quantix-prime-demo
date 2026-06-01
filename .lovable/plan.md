
## Problema

Acum forecast-ul folosește doar `labourPlanned` din task-uri cu `crewId + plannedHours` și `boqCommitted` din alocările order/delivered. Dacă planner-ul are doar bare (start/end fără crew) și BoQ are linii fără alocări, costul apare artificial mic → forecast pozitiv fals.

User vrea **un forecast inițial credibil** doar din ce există deja: BoQ budget + durata task-urilor din planner.

## Soluție

Extind `computeProfitForecastFromInputs` în `src/lib/profitForecast.ts` cu un mod "indicative" care **completează gap-urile** prin heuristici, marcate clar ca estimări:

### 1. Labour baseline din durata planner
Pentru fiecare task fără `plannedHours` sau fără `crewId`:
- estimez ore = `durationDays(task) × 8h × crewSizeDefault` (default 2 persoane)
- aplic un `defaultLabourRate` (medie din `labour.ts`, ex £45/h) când nu există `crewId`
- adun într-un nou câmp `cost.labourEstimated` separat de `labourPlanned`

`cost.labourPlanned` rămâne neschimbat (committed). Totalul folosit în EAC devine `labourPlanned + labourEstimated`.

### 2. Materials baseline = BoQ budget
Deja folosim `Math.max(boqBudget, boqCommitted)` deci asta funcționează. Adaug câmp explicit `cost.materialsEstimated = boqBudget - boqCommitted` (porțiunea neangajată încă) pentru transparență.

### 3. Fallback când planner-ul e gol
Dacă `tasks.length === 0` dar avem `contractValue + boqBudget`:
- labour estimat = `(contractValue - boqBudget) × 0.35` (heuristică labour ≈ 35% din valoarea adăugată)

### 4. Confidence rămâne la fel
Score-ul scade automat când totul e estimat — asta e corect. Adaug în `note` cât din cost vine din estimate vs. committed (ex. "65% din cost este estimat — adaugă crew-uri și order-uri pentru precizie").

### 5. Drivers
Adaug un driver nou când `labourEstimated > labourPlanned`: "Labour preponderent estimat — alocă crew-uri pentru lock-in".

## UI

În `ProfitForecastCard.tsx`:
- în sub-textul KPI "Forecast cost", schimb `labour {planned}` în `labour {planned+estimated}` și adaug `(X% estimat)` când relevant
- în cost breakdown segment "Labour (Planner)" îl split în 2: "Labour committed" (full color) + "Labour estimated" (hashed/lighter)
- același tratament pentru "Materials": committed + budget-rest

În `BoqForecastBanner.tsx`: adaug o linie mică "X% din costuri estimate" sub confidence.

## Fișiere

- `src/lib/profitForecast.ts` — extind tipul `ProfitForecast.cost`, logica de calcul, drivers, note
- `src/components/financial/ProfitForecastCard.tsx` — split segmente committed/estimated în breakdown, sub-texte
- `src/components/financial/BoqForecastBanner.tsx` — indicator scurt "X% estimat"

## Detalii tehnice

```ts
// profitForecast.ts — extras
const DEFAULT_CREW_SIZE = 2;
const DEFAULT_LABOUR_RATE = 45;

// per task fără plannedHours/crewId:
const days = Math.max(1, daysBetween(t.start, t.end) + 1);
const estHours = days * 8 * DEFAULT_CREW_SIZE;
const rate = t.crewId ? effectiveRate(t.crewId, projectId) : DEFAULT_LABOUR_RATE;
labourEstimated += estHours * rate;
```

Tipul devine:
```ts
cost: {
  ...
  labourPlanned: number;     // committed (crew + hours setate)
  labourEstimated: number;   // baseline din durata task-urilor
  materialsCommitted: number;
  materialsEstimated: number;
  estimatedCostShare: number; // 0..1 — pentru UI badge
  ...
}
```
