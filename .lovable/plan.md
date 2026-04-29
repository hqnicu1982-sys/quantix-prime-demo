
# Dashboard cu vizibilitate și editare pe rol

Acum în app `tier`-ul există doar ca etichetă afișată (Admin / Pro Control / Pro / Site User / Operative), iar `PersonaToggle` din sidebar e doar cosmetic — nu filtrează nimic. Vreau să transform asta într-un sistem real de **vizibilitate + editare + scope**, fără backend (rămânem pe localStorage/mock, ca restul appului).

Trei layere:

1. **Cine sunt eu** — un selector de "View as" (mock auth) ca să poți vedea appul ca Admin, QS, Site Manager, Foreman, Dryliner, etc.
2. **Permisiuni declarative** — o singură sursă de adevăr pentru ce poate face fiecare tier.
3. **Scope-ul meu** — pentru Operative/Site User: ce task-uri, ce zone, ce PW rates, ce crew-uri îl privesc personal. Le scoatem în evidență pe dashboard și restul îl ascundem sau îl gri-uim.

---

## 1. Identitate curentă (mock auth)

**Fișier nou: `src/lib/currentUser.ts`**

- `useCurrentUser()` → întoarce membrul activ din `team` (default `na` — Nick Andrei, Site Manager). Persistă în `localStorage` (`qp-current-user`).
- `setCurrentUser(memberId)` + event `qp-current-user-change` (același pattern ca `labour.ts`).
- Helper `useCurrentTier()` → derivă tier-ul din member.

**UI: card "Viewing as" în sidebar footer** (înlocuiește blocul static "Nick Andrei · Site Manager"):
- Avatar + nume + tier badge.
- Click → popover cu listă de membri (din `team`) grupați pe tier. Selecția schimbă instant întreaga UI.
- Buton mic "Reset to Admin" pentru demo.

(Persona toggle Site/Commercial rămâne — e ortogonal: e despre *focus*, nu despre permisiuni. Dar îl re-poziționăm ca un filtru de "ce navigation group e emphasised", nu ca "rol".)

---

## 2. Permisiuni declarative

**Fișier nou: `src/lib/permissions.ts`**

```ts
export type Capability =
  | "view.financials"      // Financial dashboard, margin, profit
  | "view.boq"             // Costed BoQ
  | "edit.boq"
  | "upload.prices"        // Price list upload
  | "approve.calloffs"
  | "create.calloffs"
  | "sign.invoices"
  | "view.invoices"
  | "edit.planner"
  | "view.planner"
  | "log.labour"           // Daily report, log own hours/PW
  | "log.labour.others"    // log for other crew members
  | "edit.team"            // invite, change rates, assign
  | "edit.pw.rates"
  | "view.pw.rates"
  | "manage.users"
  | "view.variations"
  | "edit.variations";

export const TIER_CAPS: Record<Tier, Capability[]> = { ... };
export function can(tier: Tier, cap: Capability): boolean;
export function useCan(cap: Capability): boolean;
```

Mapping (aliniat cu `PermissionMatrix`-ul existent + extins):

| Capability | Admin | Pro Control (QS) | Pro (SM/Estimator) | Site User (Foreman) | Operative |
|---|---|---|---|---|---|
| view.financials | ✓ | ✓ | read-only | – | – |
| edit.boq / upload.prices / sign.invoices | ✓ | ✓ | – | – | – |
| approve.calloffs | ✓ | ✓ | – | – | – |
| create.calloffs | ✓ | ✓ | ✓ | – | – |
| edit.planner | ✓ | ✓ | ✓ | – | – |
| log.labour.others | ✓ | ✓ | ✓ | ✓ | – |
| log.labour (self) | ✓ | ✓ | ✓ | ✓ | ✓ |
| edit.pw.rates | ✓ | ✓ | – | – | – |
| view.pw.rates | ✓ | ✓ | ✓ | ✓ (own scope) | ✓ (own scope) |
| edit.team / manage.users | ✓ | – | – | – | – |

---

## 3. Aplicarea permisiunilor

### Sidebar (`AppLayout.tsx`)
Fiecare `NavItem` capătă opțional `requires?: Capability`. Itemii fără permisiune **dispar** complet (nu doar gri). Exemple:
- Financial → `view.financials` (Operative/Site User nu-l vede deloc)
- Costed BoQ, Price Lists Upload, Invoices → ascunse pentru Site/Operative
- Team & Roles → vizibil read-only pentru toți, dar editare doar cu `edit.team`
- Settings/Labour Rates → doar Admin/Pro Control

### Butoane / acțiuni
Wrapper subțire `<Gated cap="...">` și hook `useCan`. Aplicat pe:
- "New BoQ line", "Approve call-off", "Sign invoice", "Edit rates"
- Pe `LogLabourDialog`: dacă nu am `log.labour.others`, selectorul "Member" e blocat la mine însumi.
- Pe Team page: butoanele "Invite", "Edit rate", "Assign" devin disabled cu tooltip "Requires Admin".

### Pagini întregi
Route guard simplu: într-un `RouteGuard` din `__root` sau în fiecare route component, dacă nu ai cap-ul → afișăm un `<NoAccess>` card cu listă de tier-uri care au acces. Nu folosim TanStack `beforeLoad` (e mock auth, nu vrem redirect-uri).

---

## 4. Dashboard-ul devine role-aware

Pe `/` (index) și pe `/projects/$projectId` adăugăm o secțiune **"Your scope today"** care variază pe tier:

### Operative / Site User (e.g., Marcin, Paweł, Andy)
Card mare "Your scope today" deasupra a orice altceva:
- **Crew-ul meu** — nume crew, câți oameni, unde sunt (din `crewSummary`).
- **Task-urile mele active** — filtrate din planner unde `assigneeId === me` sau `crewId` match.
- **PW rates active pentru mine** — din `getPriceWorkRates(projectId)` filtrate după `taskId`/scope-ul crew-ului meu. Highlight verde pe ratele "available to claim today".
- **Hours/PW logged today** — sumă din `laborLog` pentru member-ul meu.
- Buton mare CTA: "Log my work" → deschide `LogLabourDialog` pre-completat cu mine.
- Restul dashboard-ului (KPI financiari, margin, three-way comparison) → **ascuns**.

### Pro / Site Manager (Nick)
- Vede toate KPI execution + Planner health + Daily report status.
- Financials → variantă "lite" (doar Spent vs Budget %, fără margin/profit).
- "Your scope": proiectele unde e Site Manager (din `assignments` cu `projectRole = "Site Manager"`).

### Pro Control / QS (Sarah)
- Vede tot ce e financiar (full Three-way comparison, margin, forecast).
- Card "Awaiting your approval": call-offs pending, invoices to sign, variations to price.
- Planner + Daily report → read-only (ascunde butoanele "log labour").

### Admin (David)
- Vede tot. În plus, un card "Team activity" (ultimele invite-uri, schimbări de rate, useri pending).

### Highlight vizual al scope-ului
Pe paginile partajate (Planner, Daily Report, Team), liniile "ale mele" primesc un border-left accent + badge mic "You" sau "Your crew", restul rămân vizibile dar ușor desaturate (opacity 0.7), ca să-ți spună creierul "asta te privește pe tine direct, dar vezi și restul pentru context".

Toggle în header-ul fiecărei pagini: **[ My scope · All ]** — by default e "My scope" pentru Operative/Site User, "All" pentru Pro+.

---

## 5. Permission Matrix devine interactivă

Pe `/team` (sau `/projects/$id/team`), `PermissionMatrix`-ul existent capătă:
- Highlight pe rândul tier-ului meu curent.
- Coloanele se mapează la `Capability`-urile reale (nu mai sunt hardcoded ca acum).
- Sub matrice: link "View as Marcin (Operative)" → schimbă currentUser, ca să demonstrezi diferența imediat.

---

## Tehnic — fișiere atinse

**Noi:**
- `src/lib/currentUser.ts` — store + hook
- `src/lib/permissions.ts` — `Capability`, `TIER_CAPS`, `can()`, `useCan()`
- `src/components/auth/Gated.tsx` — wrapper pe acțiuni/secțiuni
- `src/components/auth/CurrentUserSwitcher.tsx` — popover sidebar
- `src/components/auth/NoAccess.tsx` — fallback pentru pagini interzise
- `src/components/dashboard/MyScopeCard.tsx` — variantă pe tier

**Editate:**
- `src/components/AppLayout.tsx` — `requires` pe NavItem, înlocuiește footerul static, filtrează groupurile.
- `src/routes/index.tsx` și `src/routes/projects.$projectId.index.tsx` — branșează `MyScopeCard` + ascunde secțiunile financiare după caz.
- `src/routes/financial.tsx`, `src/routes/invoices.tsx`, `src/routes/calloffs.tsx`, `src/routes/costed-boq.tsx`, `src/routes/price-lists.upload.tsx`, `src/routes/settings.labour.tsx` — wrap cu route guard.
- `src/components/daily-report/LogLabourDialog.tsx` — restricționează "log for others".
- `src/routes/projects.$projectId.team.tsx` — disable butoane fără `edit.team` / `edit.pw.rates`.
- `src/routes/projects.$projectId.planner.tsx`, `src/routes/daily-report.tsx` — toggle "My scope · All" + highlight rânduri.
- `src/components/team/PermissionMatrix.tsx` — coloane derivate din `Capability`.

---

## Întrebări înainte să încep

1. **Default user**: păstrăm Nick (Site Manager / Pro) ca default la prima încărcare, sau preferi să pornească ca David (Admin) ca să vadă tot din start?
2. **Operative behavior**: când Marcin se loghează, ascundem complet financiarii din dashboard, sau lăsăm un placeholder "Restricted — ask your QS"?
3. **"My scope" highlight**: aplicăm border + desaturare pe celelalte rânduri (Planner/Daily Report), sau preferi un toggle hard care ascunde complet ce nu te privește?
4. **Persona toggle Site/Commercial**: îl păstrăm ca filtru de focus (cum e acum) sau îl scoatem și lăsăm rolul să decidă singur ce nav vede userul?

Confirmă planul (și răspunsurile la întrebări dacă ai preferințe) și încep implementarea.
