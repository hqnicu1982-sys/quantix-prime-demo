# Calculator redesign — Direcția B (Command bar + canvas)

Reorganizăm pagina ca un **canvas curat** focalizat pe perete + cantități, cu toate controalele top-level colapsate într-o **bară-comandă** discretă. Recommend și Compare devin overlay-uri (sheet/dialog), nu moduri full-page.

## Layout final

```text
┌──────────────────────────────────────────────────────────────┐
│ HERO mic: "From a code to a priced BoQ" + brand pill         │
├──────────────────────────────────────────────────────────────┤
│ ╭───────────── COMMAND BAR (sticky, glass) ──────────────╮   │
│ │ BG ▾ │ Partitions ▾ │ WB12.5×2 · 92mm ▾ │ Auto board ▾ │   │
│ │                              [✨ Recommend] [⇄ Compare] │   │
│ ╰─────────────────────────────────────────────────────────╯   │
│                                                              │
│ ┌──────────────── CANVAS ────────────┬─── QUANTITIES ─────┐ │
│ │ System tier banner (fire/Rw/H)     │ Live BoQ            │ │
│ │                                    │  Boards   38.4 m²   │ │
│ │  ┌────────────────────────────┐    │  Studs    9 lengths │ │
│ │  │      12.5 m  ×  3.0 m      │    │  Track    4 lengths │ │
│ │  │      = 37.5 m²             │    │  ...                │ │
│ │  └────────────────────────────┘    │                     │ │
│ │  Length [12.5] m   Height [3.0] m  │  Subtotal  £xxx     │ │
│ │  Waste ──●──── 5%                  │                     │ │
│ │                                    │ [+ Add to BoQ]      │ │
│ │  ▸ Finish & stage options          │ [Export]            │ │
│ │  ▸ Compare board sizes             │                     │ │
│ └────────────────────────────────────┴─────────────────────┘ │
└──────────────────────────────────────────────────────────────┘
```

## Schimbări concrete

### 1. Command bar nouă (înlocuiește 3 rânduri actuale)
Componentă nouă `CalcCommandBar` care **înlocuiește**:
- mode pills (`By code / Recommend / Compare`) — dispar ca toggle vizibil,
- `CategoryTabs` (8 pill-uri orizontale),
- selectorul "System code" din secțiunea 01,
- selectorul "Board size" din secțiunea 02.

Devin **4 chip-dropdowns** într-un singur rând sticky:
- **Brand** (`BrandSelector` existent, restilat ca chip)
- **Category** — popover cu cele 8 categorii (label + count)
- **System** — popover cu lista filtrată pe categorie (search + cod + shortName + bespoke badge)
- **Board** — popover Auto / 1200×2400 / 1200×3000 etc.

Plus 2 butoane secundare în dreapta:
- `✨ Recommend` → deschide **Sheet** (drawer dreapta) cu form-ul actual de match-by-requirements
- `⇄ Compare` → deschide **Dialog** full-screen cu `CompareView` actual (sau toggle care sparge canvas-ul în 2 coloane A/B — vezi pct. 4)

### 2. Hero comprimat
- Titlul "From a code to a priced BoQ" rămâne, dar la **32px** în loc de 60px și pe un singur rând.
- Brand chip + "BG System Calculator" eyebrow rămân.
- Subtitle scurtat la o singură frază.
- Câștigăm ~150px verticali ca să încapă canvas + quantities fără scroll pe 1080p.

### 3. Canvas + Quantities (2 coloane)
Înlocuim grid-ul actual `[1fr 380px]` cu **același split, dar conținut diferit**:

**Stânga (canvas):**
- Sus: tier banner existent (fire / Rw / max H chips) — neschimbat.
- Mijloc: dreptunghi vizual proporțional cu length×height (SVG simplu, nu drag deocamdată), cu readout "L × H = m²" în interior. **Asta e singura componentă vizuală nouă** — `WallPreview`.
- Dedesubt: cele 2 `BigNumberField` (Length, Height) — ca acum.
- Slider waste cu label inline.
- Recommendation chip (lightbulb) — ca acum, sub câmpuri.
- Cele 2 `Disclosure` existente (`Finish & stage options`, `Compare board sizes`) rămân, dar **colapsate by default** și mutate la bază.

**Dreapta (quantities):**
- Devine **sticky** (`position: sticky; top: ...`) ca să fie mereu vizibil când scroll-ezi.
- Listă m²/lengths cu mini-bar pe fiecare item (deja există stilul).
- Subtotal cost (dacă `canSeePricing`).
- Acțiuni primare grupate jos: `Add to BoQ`, `Plan all walls`, `Export`.

### 4. Compare ca **toggle pe canvas**, nu mod separat
În loc de `mode === "compare"` care înlocuiește toată pagina:
- Buton `⇄ Compare` în command bar activează un state `compareOn`.
- Când e on, canvas-ul stâng se sparge în 2 sub-coloane A/B (același sistem-picker chip per coloană), iar quantities din dreapta arată **delta A vs B** pe fiecare linie.
- Off → canvas single, neschimbat.
- `CompareView` existent (cu tabel mare) devine opțional, accesibil ca link "Open detailed comparison" în header-ul split-ului.

### 5. Recommend ca **Sheet**, nu fold-out
- `Sheet` din dreapta cu form-ul actual (4 input-uri + 3 select-uri).
- La submit: setează `activeCode`, închide sheet-ul, toast confirmare.
- Ștergem block-ul `mode === "recommend"` din pagină.

## Fișiere atinse

- **`src/routes/calculator.tsx`** — rescriere a `Calculator()` (header + sticky command bar + nou layout). `SingleView` se simplifică (dispar select-urile mutate în command bar, dispare secțiunea "01 Pick a system" — devine doar tier banner).
- **NEW `src/components/calculator/CalcCommandBar.tsx`** — chip-dropdowns + butoane Recommend/Compare. Folosește `Popover` din `ui/popover`.
- **NEW `src/components/calculator/WallPreview.tsx`** — SVG dreptunghi proporțional cu readout. ~50 linii, fără dependențe.
- **NEW `src/components/calculator/RecommendSheet.tsx`** — extrage form-ul existent în `Sheet` (`ui/sheet`).
- **NEW `src/components/calculator/CompareSplit.tsx`** — render side-by-side A/B canvas + delta. Reutilizează helperii din `CompareView`.
- `CompareView` actual rămâne accesibil prin link "Open detailed comparison" — nu îl ștergem.

## Ce **nu** schimbăm

- Logica de calcul (`scaledTotals`, `recommendBoardSmart`, `planWalls`, `estimateCost`) — zero modificări.
- `systemLibrary.ts`, `boardSizing.ts`, `calculatorPricing.ts` — neatinse.
- `BespokeBuildUpDialog`, `WallEditor`, `CompareTray` — neatinse.
- Comportamentul URL-ului `?mode=compare` și sync-ul cu `compareTray` — păstrate (mapate pe noul `compareOn` toggle).
- Categorii, brands, bespoke systems — neatinse.

## Risc & rollback

- Fișier mare (1524 linii) — rescrierea `Calculator()` și `SingleView()` e cea mai sensibilă bucată.
- Mitigare: extragem componentele noi pas cu pas, păstrăm `CompareView` și logica intactă.
- Dacă ceva nu merge → revenire la layout-ul actual prin git, fișierele noi pot rămâne neutilizate.

## Întrebare de aprobare

Mergem cu **Compare ca toggle pe canvas (split A/B)** — sau preferi **Compare ca dialog full-screen** care deschide `CompareView` existent neschimbat? Primul e mai elegant, al doilea e zero-risc pe Compare.
