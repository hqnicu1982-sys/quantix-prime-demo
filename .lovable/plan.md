## Scop
Implement\u0103m **toate cele 4 variante** de comportament pentru panoul `Today's urgent tasks` din sidebar, cu un selector temporar \u00een footer-ul sidebar-ului. Tu le \u00eencerci live cu datele reale ale proiectului, alegi una, iar \u00eentr-un al doilea pas scoatem selectorul \u0219i p\u0103str\u0103m doar varianta c\u00e2\u0219tig\u0103toare.

Nicio modificare de logic\u0103: sortarea / regulile / sursele de date din `SidebarQuickStats` r\u0103m\u00e2n identice. Schimb\u0103m doar **\u00eenveli\u0219ul de prezentare**.

## Cele 4 variante

**V1 \u2014 Cap fix + scroll intern**
- Wrapper cu `max-h-[280px] overflow-y-auto` + scrollbar discret (`scrollbar-width: thin`, `[&::-webkit-scrollbar]:w-1`).
- Header \u201eToday's urgent tasks \u00b7 N\u201d r\u0103m\u00e2ne sticky sus \u00een panou.
- Naviga\u021bia din sidebar nu mai e \u00eempins\u0103 niciodat\u0103.

**V2 \u2014 Collapsible (sumar + expand)**
- Implicit afi\u0219eaz\u0103 doar 1 r\u00e2nd compact: `[\u26a0] 4 urgent \u00b7 2 critical  \u25be`.
- Click \u2192 list\u0103 complet\u0103 (`max-h-[60vh] overflow-y-auto`), absolute-positioned peste con\u021binut sau inline expand (configurabil; default inline).
- Stare persistat\u0103 \u00een `localStorage` (`qp.sidebar.urgent.expanded`).

**V3 \u2014 Top 2 + \u201evezi tot\u201d**
- Footer afi\u0219eaz\u0103 doar primele 2 carduri (cele mai critice, dup\u0103 sortarea existent\u0103).
- Sub ele: `+N more \u00b7 open dashboard` (deja exist\u0103) c\u0103tre `/`.
- \u00cen\u0103l\u021bime aproape constant\u0103.

**V4 \u2014 Bell \u00een header**
- Footer-ul sidebar-ului dispare complet.
- \u00cen `AppLayout` header (l\u00e2ng\u0103 `HeaderUserMenu`) ad\u0103ug\u0103m un buton clopo\u021bel cu badge ro\u0219u (count critic).
- Click \u2192 `Popover` (shadcn) cu acelea\u0219i carduri (`max-h-[70vh] overflow-y-auto`, l\u0103\u021bime ~360px).
- Sidebar 100% naviga\u021bie.

## Schimb\u0103ri tehnice

**Nou \u2014 `src/lib/sidebarUrgentMode.ts`**
- `type UrgentMode = "scroll" | "collapsible" | "top2" | "bell"`
- `useUrgentMode()` / `setUrgentMode()` cu persisten\u021b\u0103 \u00een `localStorage`.

**Refactor \u2014 `src/components/SidebarQuickStats.tsx`**
- Extragem calculul listei `urgent[]` \u00eentr-un hook `useUrgentTasks()` (acela\u0219i cod, doar mutat).
- Component primar prime\u0219te `mode` prop \u0219i randeaz\u0103 \u00eenveli\u0219ul corespunz\u0103tor (`UrgentScroll`, `UrgentCollapsible`, `UrgentTop2`). C\u00e2nd `mode === "bell"`, componenta returneaz\u0103 `null`.

**Nou \u2014 `src/components/HeaderUrgentBell.tsx`**
- Folose\u0219te `useUrgentTasks()` + `Popover` din shadcn. Render doar c\u00e2nd `mode === "bell"`.

**Edit \u2014 `src/components/AppLayout.tsx`**
- \u00cen footer-ul sidebar-ului ad\u0103ug\u0103m un selector mic (4 chips: Scroll / Collapse / Top 2 / Bell) deasupra panoului \u2014 marcat clar `PREVIEW MODE`.
- \u00cen bara de sus, ad\u0103ug\u0103m `<HeaderUrgentBell />` l\u00e2ng\u0103 `HeaderUserMenu`.

## Out of scope
- F\u0103r\u0103 schimb\u0103ri \u00een regulile de severitate, sortare sau surse de date.
- F\u0103r\u0103 notific\u0103ri push / realtime.
- Selectorul `PREVIEW MODE` se scoate dup\u0103 ce alegi varianta final\u0103 (pas 2, dup\u0103 feedback-ul t\u0103u).

## Verificare
- `bun test` (existing 213 tests trebuie s\u0103 r\u0103m\u00e2n\u0103 verzi).
- Smoke vizual pe Dashboard cu fiecare din cele 4 moduri: sidebar nu mai e \u00eempins, naviga\u021bia mereu accesibil\u0103, click pe taskuri duce pe pagina corect\u0103.