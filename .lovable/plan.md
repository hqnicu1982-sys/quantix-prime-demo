# £/m² pe cardurile din System Catalog

## Situația curentă
- `src/routes/catalog.tsx` afișează 7 sisteme cu **doar performance specs** (height, fire, Rw, thickness). Nu există cantități de material per m².
- `src/routes/calculator.tsx` are `LIBRARY` cu `totalsPerM2` (cantități per m²) doar pentru **3 sisteme**: `GIWL-146-I-80-1L-DL15 (B)`, `GIWL-92-C-50-2L-WB12.5`, `GIWL-146-I-80-2L-SB15`.
- Costed BoQ (`costedBoqRows`) are prețurile per material — bridged deja prin `src/lib/calculatorPricing.ts` (helper-ul nou `estimateCost`).

## Problema
Doar 3 din 7 carduri pot avea un cost real onest. Restul (`GDWL-DL15-1L`, `C-48/70-1L-WB15`, `C-92/146-2L-SB`, `S-CW-120`, `MF-CASOLINE`) n-au build-up cantitativ — n-aș vrea să inventez prețuri.

## Soluție (în 2 pași — propun să facem doar pasul 1 acum)

### Pas 1 — Cost real unde avem date, „—" cinstit unde nu avem
1. **Mut `LIBRARY` + `scaledTotals` într-un modul shared** `src/lib/systemLibrary.ts` (nu e nevoie să dublez datele între calculator și catalog).
2. **Calculator** îl re-importă (fără refactor logic).
3. **Catalog**: pentru fiecare card, dacă `m.code` există în `systemLibrary`, calculez `estimateCost(scaledTotals(sys, 1, 1.05), 1, 1.05)` (per 1 m², 5% waste) și afișez un nou chip `£ NN /m²` cu split material+labour în tooltip. Dacă nu e în library → chip discret „price n/a · open in calculator".
4. **Sort**: adaug opțiunea „Cheapest £/m²" care ridică în top sistemele cu price și împinge n/a-urile la coadă.

### Pas 2 (opțional, viitor)
Extind `LIBRARY` cu `totalsPerM2` pentru celelalte 4 sisteme (GypWall CLASSIC, QUIET, ShaftWall, CasoLine MF). Vine cu cantități realiste din NBS — dar e un job de date separat, nu de UI.

## Fișiere modificate
- **Creat**: `src/lib/systemLibrary.ts` — exportă `LIBRARY`, `SystemDef`, `scaledTotals`.
- **Editat**: `src/routes/calculator.tsx` — import din modulul shared (no behavior change).
- **Editat**: `src/routes/catalog.tsx` — cost chip în card + opțiune sort „cheapest".

## UI pe card
```text
┌──────────────────────────────────────┐
│ GIWL-92-C-50-2L-WB12.5    [HIGH]    │
│ Independent lining · 2× WallBoard   │
│                                      │
│ [Height][Fire][Rw][Thick]            │
│                                      │
│ £ 38 /m²  · 65% mat / 35% labour     │
│ ─────────────────────────────────    │
│ [Compare]            Load → calc →   │
└──────────────────────────────────────┘
```

Pentru cardurile fără date: chip gri `price n/a` cu tooltip „No quantity build-up yet — open in calculator to estimate manually".

Confirmi planul (Pas 1)?