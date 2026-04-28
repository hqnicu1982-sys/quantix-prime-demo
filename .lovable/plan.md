# Cost & Labour în Live Summary (Calculator)

## Răspuns scurt la întrebare
Da — `Calculator` și `Costed BoQ` împart același model de date: calculatorul produce cantități (`totalsPerM2 × area × waste`) iar Costed BoQ are prețurile per material (`costedBoqRows` cu `rate`, `ccf`, `minster`). În prezent **Live Summary nu afișează niciun cost** — doar cantități. Le pot lega printr-un mic helper de pricing și pot adăuga labour folosind `calculatorResults.labourRate` (£24.50/m² mock).

## Ce vom afișa în noul Live Summary

Bloc nou „Cost estimate" plasat sub „Wall area", deasupra build-up-ului:

```text
┌─ COST ESTIMATE ────────────────────────────┐
│  Total system            £ 12,480          │
│  └ £ 62.40 / m²                            │
│                                            │
│  Materials   £  8,540   (best-supplier)    │
│  Labour      £  3,940   (160 h @ £24.50)   │
│                                            │
│  Coverage: 6 / 7 lines priced  •  1 review │
└────────────────────────────────────────────┘
```

Plus, în lista existentă „Aggregated totals", adaug a 3-a coloană cu costul pe linie:

```text
Gyproc WallBoard 12.5     105.0 m²    £  411
Gypframe Stud (3.0m)       21.0 lengths £ 260
Jointing                    60.0 kg    £   —   ⓘ no price
```

## Surse de date (re-folosim ce există, zero date noi)

- **Material price**: `costedBoqRows` din `src/lib/mockData.ts` — match pe `name` (case-insensitive contains) → folosim `Math.min(ccf ?? rate, minster ?? rate)` ca „best price". Liniile fără match → marcate „no price" (nu mint un preț).
- **Labour**: `calculatorResults.labourRate` (£24.50/m²) × `area × wasteFactor` pentru cost; productivitate 0.4 h/m² ca să afișăm și ore.
- **Coverage**: `priced / totalLines` — onest pentru utilizator (mock-ul nu acoperă toate materialele BG).

## Fișiere de modificat / creat

1. **`src/lib/calculatorPricing.ts`** (nou, ~50 linii)
   - `priceMaterial(name) → { unitPrice, supplier } | null` — caută în `costedBoqRows`.
   - `estimateCost(totals, area, wasteFactor) → { materials, labour, total, perM2, hours, pricedLines, totalLines, lines: [...] }`
   - Productivitate: `HOURS_PER_M2 = 0.4` (export ca const).

2. **`src/routes/calculator.tsx`**
   - Import helper-ul nou; calculez `cost = estimateCost(totals, area, wasteFactor)`.
   - Adaug bloc „Cost estimate" în aside-ul Live Summary (între „Wall area" și „System build-up").
   - Adaug a 3-a coloană (cost £) în lista „Aggregated totals" — cu fallback `—` și tooltip „no price in catalogue" pentru linii ne-prețuite.
   - Pasez `cost.total` și `cost.perM2` și la `AddToBoqButton` (toast cu valoarea).

3. **`src/routes/projects.$projectId.calloffs.tsx`** — *nimic*. Live Summary rămâne o feature izolată în calculator; nu propag costul în BoQ-ul proiectului în acest task (rămâne pe rate de la furnizor în Costed BoQ).

## Edge cases tratate
- `invalid` (input rupt): blocul Cost arată `—`, nu zerouri false.
- 0 linii prețuite: arătăm doar Labour + un hint „add prices in Costed BoQ".
- Sistem bespoke (fără rate fixe): folosim totuși matching pe nume material; ce nu se găsește = „no price".

## Ce NU includem (pot fi follow-ups dacă vrei)
- Toggle CCF vs Minster vs Best (acum doar best).
- Markup / margin pe deasupra costului.
- Persistarea „cost snapshot" în `projectData` când apeși „Add to Costed BoQ".

Confirmi planul ca să-l implementez?