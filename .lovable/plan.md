## Goal

Mută user menu (Sign out + identitate) din sidebar footer în header, ca un dropdown stil Lovable (avatar NA → nume + email + Account settings + View as + Sign out). Înlocuiește footer-ul sidebar-ului cu un **Quick Stats card** orientat pe acțiune.

---

## 1. Header — User Menu Dropdown (înlocuiește butoanele Sign in/Sign up când e logat)

**Component nou**: `src/components/auth/HeaderUserMenu.tsx`

Dropdown declanșat de avatar circular (inițiale, gradient accent→teal, 32px), aliniat la dreapta. Conținut:

```text
┌─────────────────────────────┐
│  Nicolae Aldea              │  ← name (semibold)
│  na@quantix.dev             │  ← email (muted)
├─────────────────────────────┤
│  ⚙  Account settings        │  → /settings/labour (sau placeholder)
├─────────────────────────────┤
│  VIEW AS  (demo)            │  ← mic label uppercase
│   ✓ Admin · David Park      │  ← lista grupată pe tier-e
│     Pro · Nick Andrei       │     (refolosim logica din
│     Site User · Sam M.      │      CurrentUserSwitcher)
├─────────────────────────────┤
│  →  Sign out                │  ← roșu, full width
└─────────────────────────────┘
```

- Folosește `Popover` din shadcn (există deja `src/components/ui/popover.tsx`) pentru anchoring corect lângă avatar.
- Refolosește logica de `setCurrentUserId` + `signOut` + `team` grouping din `CurrentUserSwitcher.tsx`.
- Toast „Signed out" + redirect la `/login` ca acum.

**În `AppLayout.tsx` header (linia ~440)**:
- Când `session` există → înlocuiește butoanele Sign in/Sign up cu `<HeaderUserMenu />`.
- Când nu există session (pagini publice ca `/how-to`) → păstrăm butoanele Sign in/Sign up actuale.
- Punct de inserție: după Bell, ultimul element din `ml-auto`.

---

## 2. Sidebar Footer — Quick Stats Card (înlocuiește `<CurrentUserSwitcher />`)

**Component nou**: `src/components/SidebarQuickStats.tsx`

Card compact (în zona unde era user switcher-ul, `border-t border-white/10 p-3`):

```text
┌──────────────────────────────┐
│ HOTEL FITZROVIA       ●      │  ← project name + green dot (on-track)
│ £2.1m · Kier                 │  ← value + contractor (muted)
├──────────────────────────────┤
│  3      2       5            │  ← cifre mari
│ Approvals  Overdue  Active   │  ← labels mici uppercase
│           Invoices  Tasks    │
├──────────────────────────────┤
│  →  Open approval inbox      │  ← link compact către dashboard
└──────────────────────────────┘
```

**Surse de date** (toate există deja):
- `useProject().current` → nume, contractor, valoare
- `useLabourLogs(projectId)` filtrat `status === "submitted"` → Approvals
- `useInvoices(projectId)` filtrat `status === "overdue"` → Overdue invoices
- `useProjectData(projectId).callOffs` filtrat `status === "draft"` → sau task-uri din planner

**Comportament**:
- Click pe oricare cifră → navigate către secțiunea relevantă (`/daily-report`, `/invoices`, `/planner`).
- Dacă userul nu are capability pe nicio secțiune → afișează doar header-ul de project (fallback minim, nu spațiu gol).
- Click pe numele proiectului → `/projects/$projectId`.

---

## 3. Files

**Create**:
- `src/components/auth/HeaderUserMenu.tsx` — dropdown user (avatar + identity + view-as + sign out)
- `src/components/SidebarQuickStats.tsx` — card stats în sidebar footer

**Edit**:
- `src/components/AppLayout.tsx`:
  - import `HeaderUserMenu`, `SidebarQuickStats`
  - în `SidebarContent` (linia 209-211) → înlocuiește `<CurrentUserSwitcher />` cu `<SidebarQuickStats />`
  - în header (linia 440-456) → când `session` există, render `<HeaderUserMenu />` în loc de butoanele Sign in/Sign up
- `src/components/auth/CurrentUserSwitcher.tsx`:
  - **Păstrăm fișierul** dar îl marcăm deprecated (nu mai e folosit). Sau îl ștergem dacă vrei curățenie — preferință: îl ștergem, fiindcă logica migrează în `HeaderUserMenu.tsx`.

**Delete** (opțional, recomandat):
- `src/components/auth/CurrentUserSwitcher.tsx` — funcționalitate complet absorbită de `HeaderUserMenu`.

---

## 4. UX details

- Avatarul din header are același gradient ca în sidebar (consistență vizuală).
- Dropdown-ul header e pe fundal alb (header e light theme), spre deosebire de cel vechi din sidebar care era pe navy. Stiluri adaptate.
- Quick Stats card folosește text alb pe navy (continuă paleta sidebar-ului).
- Pe mobile (sidebar e overlay), Quick Stats apare la fel jos în sidebar-ul drawer.
- Indicator roșu mic pe avatar dacă există approvals pending (paritate cu Bell-ul).

---

## 5. Out of scope

- Nu schimbăm pagina `/settings/labour` — link-ul „Account settings" merge acolo ca placeholder.
- Nu adăugăm preference-uri reale de cont (mock auth).
- Nu schimbăm logica de route guard sau session.
