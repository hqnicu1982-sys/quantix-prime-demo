## Audit RBAC — matrice rol × suprafață

Confirmat prin inspecția codului. Legenda: ✅ corect · ⚠️ scurgere de remediat.

### Dashboard general `/`
| Rol | Status |
|---|---|
| Admin / Pro Control | ✅ vede tot (KPI + margin trend) |
| Pro | ✅ vede KPI lite, fără margin trend |
| Site User / Operative | ✅ redirect la `MyScopeCard` (focused dashboard) |

### Pagina `/financial`
✅ Toate rolurile sub Pro Control văd `<NoAccess>`.

### Layout proiect `/projects/$projectId`
| Element | Status |
|---|---|
| Subtitle "£12.5m contract" | ⚠️ vizibil tuturor (Operative inclusiv) |
| Tab "Costed BoQ" | ⚠️ vizibil tuturor |
| Tab "Invoices" | ⚠️ vizibil tuturor |
| Tab "Variations" | ⚠️ vizibil tuturor |
| Tab "Reports" | ⚠️ vizibil tuturor |
| Tab "Specification" | ⚠️ conține `fmtMoney(s.value)` per system |

### Sub-rute proiect (acces direct via URL)
| Rută | Cap necesar | Status |
|---|---|---|
| `/projects/$id/costed-boq` | `view.boq` | ⚠️ fără page guard |
| `/projects/$id/invoices` | `view.invoices` | ⚠️ fără page guard (doar butoane gated) |
| `/projects/$id/variations` | `view.variations` | ⚠️ fără page guard |
| `/projects/$id/reports` | `view.financials.lite` | ⚠️ fără page guard |
| `/projects/$id/specification` | `view.boq` | ⚠️ valori comerciale expuse |
| `/projects/$id/calloffs` | `view.calloffs` | ⚠️ fără page guard (Operative nu are cap) |
| `/projects/$id/team` | `view.team` | ⚠️ fără page guard (Operative nu are cap) |
| `/projects/$id/labour` | `view.dailyReport` | ✅ toți au cap |
| `/projects/$id/planner` | `view.planner` | ✅ toți au cap |

### Rute globale
| Rută | Cap necesar | Status |
|---|---|---|
| `/calloffs` | `view.calloffs` | ⚠️ Operative ar vedea |
| `/variations` | `view.variations` | ⚠️ Site User + Operative ar vedea |
| `/costed-boq` | `view.boq` | ⚠️ Site User + Operative ar vedea |
| `/price-intelligence` | `view.priceIntel` | ⚠️ Site User + Operative ar vedea |
| `/catalog` | `view.priceIntel` (de adăugat) | ⚠️ fără gating |
| `/integrations` | `view.integrations` | ⚠️ Pro/Site/Operative ar vedea |
| `/team` | `view.team` | ⚠️ Operative ar vedea |
| `/readiness` | `view.boq` | ⚠️ fără gating |
| `/calculator` | `view.boq` | ⚠️ fără gating |
| `/planner` | `view.planner` | ✅ |
| `/daily-report` | `view.dailyReport` | ✅ |

### `ApprovalInboxCard`
⚠️ Apare în Overview-ul proiectului pentru toate rolurile. Operative / Site User nu au capability de aprobat — card-ul ar trebui ascuns dacă nu există nicio acțiune actionabilă (`approve.labour` / `edit.variations` / `sign.invoices` / `approve.calloffs`).

---

## Remediere

### 1. Page-level `<NoAccess>` guards (10 rute)
Pattern uniform deja folosit în `financial.tsx` / `invoices.tsx`:
```tsx
function GuardedX() {
  const allowed = useCan("view.X");
  if (!allowed) return <NoAccess cap="view.X" title="..." />;
  return <X />;
}
export const Route = createFileRoute(...)({ component: GuardedX });
```

Aplicat pe:
- `projects.$projectId.costed-boq.tsx` → `view.boq`
- `projects.$projectId.invoices.tsx` → `view.invoices`
- `projects.$projectId.variations.tsx` → `view.variations`
- `projects.$projectId.reports.tsx` → `view.financials.lite`
- `projects.$projectId.specification.tsx` → `view.boq`
- `projects.$projectId.calloffs.tsx` → `view.calloffs`
- `projects.$projectId.team.tsx` → `view.team`
- `calloffs.tsx`, `variations.tsx`, `costed-boq.tsx`, `price-intelligence.tsx`, `catalog.tsx`, `integrations.tsx`, `team.tsx`, `readiness.tsx`, `calculator.tsx` → cap-ul corespunzător

### 2. Filtrare TAB-uri în `projects.$projectId.tsx`
Adaug `requires?: Capability` pe `TABS[]` și filtrez cu `useCan` înainte de render. Tab-urile dispar pentru rolurile fără capability — Site User vede doar Overview / Specification (dacă rămâne) / Planner / Labour.

### 3. Ascundere valoare contract în subtitle
Construiesc `subtitle` condițional: dacă `useCan("view.financials.lite")` este false, omit `fmtMoney(project.contractValue)` din header.

### 4. Ascundere valori în `specification.tsx`
Wrap `{fmtMoney(s.value)}` în `useCan("view.financials.lite")`.

### 5. `ApprovalInboxCard` — ascundere pentru roluri fără acțiuni
Card-ul nu se randează dacă utilizatorul nu are nicio capability din: `approve.labour`, `edit.variations`, `sign.invoices`, `approve.calloffs`.

### 6. Extindere audit script
`scripts/audit-rbac.mjs` capătă o nouă verificare: orice fișier `src/routes/*.tsx` care expune un cap "non-universal" (deja definit într-o listă) trebuie să aibă fie `<NoAccess` fie un wrapper `Guarded*` în component. Listă derivată din mapping rută→cap definit în plan. Audit-ul eșuează la build dacă o rută nouă uită guard-ul.

### 7. Teste unit pentru guards
Extind `Gated.test.tsx` (sau adaug `route-guards.test.tsx`) cu un test parametrizat: pentru fiecare rută gated × fiecare rol, randează componenta și verifică prezența / absența `<NoAccess>`. ~70 cazuri noi, sub 2s.

---

## Fișiere modificate
- `src/routes/projects.$projectId.tsx` (subtitle + TAB filtering)
- `src/routes/projects.$projectId.specification.tsx` (page guard + ascundere `s.value`)
- `src/routes/projects.$projectId.costed-boq.tsx` (page guard)
- `src/routes/projects.$projectId.invoices.tsx` (page guard la nivel de rută)
- `src/routes/projects.$projectId.variations.tsx` (page guard)
- `src/routes/projects.$projectId.reports.tsx` (page guard)
- `src/routes/projects.$projectId.calloffs.tsx` (page guard)
- `src/routes/projects.$projectId.team.tsx` (page guard)
- `src/routes/calloffs.tsx`, `variations.tsx`, `costed-boq.tsx`, `price-intelligence.tsx`, `catalog.tsx`, `integrations.tsx`, `team.tsx`, `readiness.tsx`, `calculator.tsx` (page guards)
- `src/components/dashboard/ApprovalInboxCard.tsx` (early return dacă nicio acțiune)
- `scripts/audit-rbac.mjs` (verificare route guards)
- `src/lib/route-guards.test.tsx` (teste noi)

## Rezultat după remediere
- **Operative**: vede doar Dashboard focused, Planner, Daily Report, PW Rates, Profile. Niciun URL direct nu expune date comerciale.
- **Site User**: idem + Call-offs (read-only) + Team (read-only). Nu vede BoQ, Invoices, Variations, Financial, Price Intel.
- **Pro**: vede tot ce e read-only comercial (BoQ, Variations, Call-offs, Invoices) + scrie Call-offs + edit Planner. Nu vede Financial dashboard, nu aprobă, nu editează BoQ.
- **Pro Control**: tot, fără `manage.users` și `edit.team`.
- **Admin**: tot.