## Obiectiv

Răspuns la întrebarea „va face jobul profit?" încă de la kickoff, refolosind ce există deja: `contractValue`, `estimatedBoq`, alocările BoQ, taskurile planner (cu `plannedHours` + crew rate), variațiile cu `costImpact` și (când e conectat) baseline-ul din MSProject.

## Ce există azi (și de ce nu răspunde încă)

- `Project.contractValue` și `estimatedBoq` (venit vs buget cost) — `src/lib/mockData.ts`
- `boqAllocation.ts` — buget vs „reserved/committed" pe linie BoQ
- `planner.ts` — `plannedHours × effectiveRate(crew, project)` = cost labour planificat
- `variations.ts` — `costImpact` și `timeImpactDays` per VO, cu status
- `cashflowForecast.ts` — proiecție cash, dar nu margin
- Financial Dashboard arată margin actual MTD, nu un *forecast at completion* (EAC)

Lipsește un singur loc unde toate astea se adună într-o predicție „la final" cu un semafor go/at-risk/no-go.

## Ce construim

### 1. `src/lib/profitForecast.ts` (nou)
Funcție pură `computeProfitForecast(projectId)` care returnează:

```text
{
  revenue: {
    contractValue,
    approvedVOs,           // sum costImpact, status=approved & priced as sell
    pendingVOs,            // status=submitted/draft
    forecastRevenue        // contractValue + approvedVOs (+ pendingVOs * confidence)
  },
  cost: {
    boqCommitted,          // sum lines.committed
    boqRemaining,          // budget − committed pentru linii nealocate
    labourPlanned,         // Σ plannedHours × effectiveRate pe toate taskurile
    labourActual,          // din laborLog (cât s-a logat deja)
    variationCost,         // costImpact al VO-urilor (approved + weighted pending)
    overheads,             // % din revenue (configurable, default 8%)
    riskBuffer,            // % din cost (default 5%)
    forecastCostAtCompletion
  },
  margin: {
    targetMargin,          // current.margin (din mockData)
    forecastMargin,        // (revenue − cost) / revenue
    deltaVsTarget,
    verdict: "profit" | "tight" | "loss"
  },
  confidence: {
    boqAllocatedPct,       // % linii BoQ cu commitment
    plannerScheduledPct,   // % taskuri cu crew + plannedHours
    msProjectLinked,       // bool
    score: 0..100          // medie ponderată
  },
  drivers: [               // top 3 motive pt verdict
    { label, deltaMoney, kind: "labour"|"materials"|"vo"|"overhead" }
  ]
}
```

Algoritm verdict:
- `profit` dacă `forecastMargin >= targetMargin − 2pp`
- `tight` dacă între −2pp și −5pp
- `loss` dacă sub −5pp sau cost > revenue

### 2. `ProfitForecastCard` (nou) — `src/components/financial/ProfitForecastCard.tsx`

Layout:
- **Header semafor**: verdict + forecast margin vs target (badge verde/amber/roșu)
- **3 KPI**: Forecast revenue · Forecast cost at completion · Forecast profit (£ + %)
- **Bară confidence**: „Forecast based on X% BoQ allocated, Y% planner scheduled" — dacă <40% afișează „⚠ Forecast preliminar"
- **Breakdown stacked bar**: Materials (BoQ) | Labour (Planner) | Subcontracts | VOs | Overheads | Risk vs Revenue line
- **Top drivers**: 3 rânduri cu „Labour over budget +£32k (planner depășește estimator cu 480h)" etc.
- **CTA**: „Open BoQ" / „Open Planner" / „Review VOs"

### 3. Integrări

- `src/routes/financial.tsx` — adăugăm `<ProfitForecastCard projectId={current.id} />` ca prim card sub KPI-uri (înainte de `LiveLabourCostCard`). Răspunde direct la „va face profit?".
- `src/routes/projects.$projectId.index.tsx` — același card într-o variantă compactă în Project Overview, ca primul lucru pe care îl vede PM-ul când deschide jobul.
- `src/routes/planner.tsx` (sau project planner) — un mini-banner „Planner adds £X labour cost → forecast margin Y%" când plannedHours se modifică, ca să se vadă imediat efectul.
- `src/routes/costed-boq.tsx` — același mini-banner când o linie e alocată/commit-uită.

### 4. Legături cu MSProject

Când `current.msProjectLinked` (flag deja folosit în integrations) e true:
- creștem `confidence.score` cu +20
- folosim baseline-ul MSProject pentru `plannedHours` per task acolo unde planner-ul intern nu are valoare
- afișăm chip „Schedule baseline: MSProject" în card

### 5. Comportament gol/incomplet

- Dacă `estimatedBoq` lipsește → forecast cost = labourPlanned + overheads, marcăm „BoQ pending" cu CTA
- Dacă planner gol → folosim `estimatedBoq` integral pentru cost și marcăm „Planner pending"
- Nicăieri nu blocăm; întotdeauna afișăm cel mai bun forecast posibil + confidence honest

## Out of scope (intenționat)

- Nu schimbăm modelul de date al proiectului (refolosim câmpuri existente)
- Nu adăugăm scenarii „what-if" (poate într-un follow-up)
- Nu modificăm logica de variations/planner/BoQ existentă

## Fișiere atinse

Create:
- `src/lib/profitForecast.ts`
- `src/lib/profitForecast.test.ts` (cazuri: missing BoQ, missing planner, VO swing, MSProject linked)
- `src/components/financial/ProfitForecastCard.tsx`

Editate:
- `src/routes/financial.tsx` (mount card sus)
- `src/routes/projects.$projectId.index.tsx` (mount card compact)
- `src/routes/projects.$projectId.planner.tsx` și `src/routes/costed-boq.tsx` (mini-banner opțional)

## Rezultat

Când PM-ul deschide un job nou, primul lucru pe care îl vede e un semafor „Forecast margin 21.4% vs target 23.8% — TIGHT, confidence 62%" cu top 3 drivers și butoane spre BoQ/Planner. La fiecare ajustare în BoQ sau Planner, numărul se recalculează live.