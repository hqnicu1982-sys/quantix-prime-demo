## Price Work (PW) pentru labour

Acum labour costul se calculează exclusiv `hours × £/h` (`effectiveRate` din `src/lib/labour.ts`). Adăugăm un al doilea mod de plată — **Price Work** — care înlocuiește rate-ul orar pentru o anumită zi/zonă/scope. Toate locurile care arată cost (Labour KPI, Crew table, Planner cost, Financial, Daily Report) trebuie să respecte modul activ.

### Concept

Pentru o zi de lucru, un crew member poate fi în unul din două moduri:
- **Day rate (default)** — `hours × £/h`, cum e azi.
- **Price Work** — sumă fixă negociată pentru o anumită cantitate de muncă (ex: £450 pentru 1st fix L5, sau £8/m² × 60 m²). Ora de lucru devine informativă, nu cost-driver.

PW rates se definesc **per proiect** (nu global) — fiecare șantier are negociere proprie.

### 1. Model de date (`src/lib/labour.ts` + `src/lib/laborLog.ts`)

Nou tip `PriceWorkRate` (per-project catalog de tarife PW):
```ts
type PriceWorkRate = {
  id: string;
  projectId: string;
  code: string;            // "PW-1FIX-L5"
  scope: string;           // "1st fix partitions L5"
  unit: "lump" | "m2" | "lm" | "nr";
  rate: number;            // £ per unit (or lump sum if unit="lump")
  boqLineId?: string;      // optional link to BoQ for variance tracking
  taskId?: string;         // optional default link to a planner task
  createdAt: number;
};
```
Stocat în `localStorage` cu cheia `qp-pw-rates-{projectId}`, hooks `usePriceWorkRates(pid)`, CRUD `addPriceWorkRate / updatePriceWorkRate / removePriceWorkRate`.

Extindem `LabourLogEntry` cu un payload opțional:
```ts
payMode?: "hourly" | "pw";       // default "hourly"
pwRateId?: string;               // ref PriceWorkRate
pwQty?: number;                  // qty units done (1 if lump)
pwAmount?: number;               // computed cost at write time
```
Helper nou `computeEntryCost(entry, projectId)`:
- dacă `payMode === "pw"` → `pwAmount` (sau `qty × rate` recalculat)
- altfel → `hours × effectiveRate(memberId, projectId)`

Toate locurile care fac `hours × rate` trec prin `computeEntryCost`.

### 2. UI — definire PW rates per proiect

Tab nou pe pagina proiectului: **Project → Labour → "Price Work rates"** (sau secțiune nouă în `src/routes/projects.$projectId.team.tsx` sub "Crew & assignments"). Tabel CRUD: `Code · Scope · Unit · Rate · BoQ link`. Buton "Add PW rate" cu dialog mic.

KPI pe header: "PW rates defined: 6 · linked to BoQ: 4".

### 3. UI — log o zi în PW (`LogLabourDialog`)

În `src/components/daily-report/LogLabourDialog.tsx` adăugăm un toggle sus: **[ Hourly | Price Work ]**.

Mod **Hourly** → comportament curent (in/out time, hours computed).

Mod **Price Work** → înlocuiește secțiunea de rate cu:
- Select `PW rate` (din `usePriceWorkRates(projectId)`) — afișează `PW-1FIX-L5 · 1st fix L5 · £8/m²`
- Input `Qty` (sau readonly "1" dacă unit=lump)
- Auto-fill `Task` din `pwRate.taskId` dacă există
- In/out time rămân (informativ — pentru ore reale lucrate, nu pentru cost)
- Box computed: `Qty × Rate = £X` (în loc de `h × £/h`)
- Câmpul `work` se prefill cu `pwRate.scope`

Exemplu user: "David astăzi e PW la L5, 1st fix" → user alege David, toggle PW, alege "PW-1FIX-L5", introduce qty 12 m², salvează → cost £96 (nu hours × rate).

### 4. Conectare la cost calculations

- **`src/routes/projects.$projectId.labour.tsx`** (Crew performance) — coloană nouă `Pay mode` cu mix indicator ("8 hourly · 3 PW") și total £ folosind `computeEntryCost`. KPI "Labour cost" se schimbă să sumeze corect ambele moduri.
- **`src/lib/planner.ts`** — `taskActualCost` primește `entries[]` în loc de doar `actualHours`, sumează prin `computeEntryCost`. PW logs pe task = cost real ferm (nu mai depinde de ore).
- **`src/routes/financial.tsx`** — secțiunea Labour pulls din suma `computeEntryCost` pe toate logurile aprobate. Adaugă breakdown `Hourly £X · PW £Y`.
- **Daily Report** (`src/routes/daily-report.tsx`) — în lista de loguri afișează badge "PW" lângă entry, cost coloana folosește `computeEntryCost`.

### 5. Variance vs BoQ (bonus, low-effort)

Dacă `PriceWorkRate.boqLineId` e setat, `Project → Costed BoQ` poate arăta o coloană "PW spent / qty" — vezi cât din linia de BoQ a fost deja contractat ca PW vs ce-a rămas de făcut.

### Rezumat fișiere

- **edit** `src/lib/labour.ts` — adaugă tip `PriceWorkRate` + CRUD + hook
- **edit** `src/lib/laborLog.ts` — extinde `LabourLogEntry`, adaugă `computeEntryCost`
- **edit** `src/components/daily-report/LogLabourDialog.tsx` — toggle Hourly/PW + UI nou
- **edit** `src/routes/projects.$projectId.team.tsx` — secțiune "Price Work rates" cu CRUD inline
- **edit** `src/routes/projects.$projectId.labour.tsx` — coloana Pay mode, KPI total folosind `computeEntryCost`
- **edit** `src/routes/projects.$projectId.planner.tsx` + `TaskDetailDialog.tsx` — afișează cost actual = sumă `computeEntryCost` pe entries linked
- **edit** `src/routes/financial.tsx` — breakdown Hourly vs PW
- **edit** `src/routes/daily-report.tsx` — badge PW + cost coloana corectă
- **edit** `src/lib/planner.ts` — `taskActualCost` acceptă `entries[]`

### Decizii de confirmat

1. **Unde ținem catalogul PW** — propun **Project → Team page**, secțiune nouă sub "Crew & assignments" (proiect-specific, lângă restul de labour-related). Alternativă: tab nou dedicat `/projects/$id/price-work`.
2. **In/out time când e PW** — le păstrăm ca info (atendance), dar nu intră în cost. OK?
3. **Mixed mode** într-o singură zi (jumate ore, jumate PW) — propun: două loguri separate (un Hourly + un PW). Simplu și auditabil.

Confirmi planul (sau spune-mi ce ajustăm) și încep implementarea.