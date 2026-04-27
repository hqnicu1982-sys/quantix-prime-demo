# Conectare end-to-end: Project → Specs → BoQ → Call-offs → Execution

## Obiectiv
Transformă ecranele independente într-un flow conectat în care un proiect nou capătă specificații, BoQ-ul derivă din calculator, supplierii aleși din Price Intelligence sunt folosiți automat la Call-offs, iar Site Managerul vede Plannerul și raportează progres pe același proiect.

## Arhitectură propusă

```text
ProjectContext (current project)
  ├─ projectData[id]
  │   ├─ systems: SystemSpec[]      ◄── Calculator "Add to BoQ"
  │   ├─ boqLines: BoQLine[]        ◄── derivat din systems
  │   ├─ suppliers: { material → supplierId }  ◄── Price Intelligence "Select"
  │   ├─ callOffs: CallOff[]        ◄── derivat din BoQ + suppliers
  │   ├─ planner: GanttRow[]        ◄── upload sau template
  │   └─ dailyReports: Report[]
  └─ persisted în localStorage
```

## Pași de implementare

### 1. Model de date partajat (`src/lib/projectData.ts`)
- Definește tipurile: `SystemSpec`, `BoQLine`, `SupplierChoice`, `CallOff`, `DailyReport`
- Hook `useProjectData(projectId)` care citește/scrie în `localStorage` (`qp-project-data-{id}`)
- Funcții: `addSystemToBoQ`, `selectSupplier`, `createCallOffFromBoQ`, `addDailyReport`
- Pentru proiectele existente (Fitzrovia etc.) — seed cu mock-urile actuale ca fallback

### 2. Extinde `NewProjectDialog`
- Tab/secțiune "Specifications" — upload PDF/CSV (mock: doar reține numele fișierului)
- Tab/secțiune "Planner" — alege template (Drylining standard / Custom) sau upload
- La submit: creează proiectul + seed gol pentru `boqLines`, `callOffs`, `dailyReports`

### 3. Calculator → BoQ
- În `calculator.tsx` adaugă buton "Add to BoQ for {current.name}"
- Apelează `addSystemToBoQ(currentId, systemSpec)` → toast + link "View BoQ"

### 4. Price Intelligence → Supplier selection
- În `price-intelligence.tsx` pe fiecare rând "best price" adaugă buton "Select for project"
- Persistă alegerea în `projectData[id].suppliers`
- Badge vizual pe materialul selectat

### 5. Costed BoQ → Call-offs
- În `costed-boq.tsx` citește `projectData[currentId].boqLines` (cu fallback la mock)
- Buton "Create call-off" pe fiecare linie → folosește supplier-ul selectat automat
- Redirect către `/calloffs` cu draft-ul pre-completat

### 6. Planner & Daily Report — citire din context
- `planner.tsx`, `daily-report.tsx`, `readiness.tsx`, `calloffs.tsx`, `financial.tsx`, `invoices.tsx` — citesc `current` din `useProject()` în header
- Afișează "{current.name}" în titluri
- Pentru proiecte custom (fără date) — empty state cu CTA "Add systems via Calculator"

### 7. Project switcher în header
- Dropdown lângă breadcrumb cu `useProject().all` + custom projects
- Schimbă `currentId` global → toate ecranele se re-randează pentru noul proiect

## Detalii tehnice

- **Persistență**: tot localStorage cu chei prefixate `qp-project-data-{id}` pentru a evita coliziuni
- **Reactivitate**: pattern `CustomEvent` ca în `customProjects.ts` pentru sync între tab-uri/componente
- **Backwards compat**: proiectele existente (Fitzrovia) primesc seed automat din `mockData.ts` la prima accesare, ca să nu spargă demo-ul
- **Fără backend**: rămâne 100% client-side mock — pregătit pentru migrare ulterioară la Lovable Cloud

## Out of scope (faze ulterioare)
- Persistență reală cu Lovable Cloud / DB
- Parsare reală a PDF-urilor de specificații
- Multi-user / roles
- Sync bidirecțional cu Plannerul (drag tasks → update dates)

## Întrebare înainte de start
Vrei să fac **toate** cele 7 pași într-un singur pas, sau preferi să livrăm incremental (ex: întâi 1+3+5 = Calculator → BoQ → Call-off, apoi restul)?
