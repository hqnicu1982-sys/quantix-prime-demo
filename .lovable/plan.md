# Plan — Detalii & documente per "Specified system"

## Context
Pe `/projects/$projectId/specification`, panoul **Specified systems** (dreapta) listează doar nume + arie + valoare. Userii vor să poată atașa detalii/documente per system (technical datasheet, BG SpecSure cert, drawing extract, fire test report, photos de pe șantier etc.).

## Ce construim

### 1. Storage layer — `src/lib/systemDetails.ts` (nou)
Pattern identic cu `bespokeSystems.ts` / `projectData.ts` (localStorage scoped per proiect, custom event + hook).

```ts
type SystemAttachment = {
  id: string;
  fileName: string;
  fileSize: number;        // bytes
  mimeType: string;
  dataUrl: string;         // base64 (mock — same approach as restul appului)
  category: "datasheet" | "certificate" | "drawing" | "test-report" | "photo" | "other";
  uploadedBy: string;      // currentUser.name
  uploadedAt: number;
  notes?: string;
};

type SystemDetails = {
  systemKey: string;       // ex. "GypWall CLASSIC (C-48/70)" (numele din fitzroviaSystems)
  description?: string;    // câmp text liber adăugat de user (override pe descrierea din library)
  installerNotes?: string; // note operaționale pentru șantier
  attachments: SystemAttachment[];
};
```

Funcții exportate: `useSystemDetails(projectId, systemKey)`, `saveSystemDetails(...)`, `addAttachment(...)`, `removeAttachment(...)`, `updateNotes(...)`.

Cheie storage: `qp-system-details-{projectId}`, payload = `Record<systemKey, SystemDetails>`.

**Limită fișier**: 5 MB / fișier, max 20 fișiere / system (validare în UI cu toast). Tipuri acceptate: PDF, PNG, JPG, DWG (afișat ca generic), DOCX, XLSX.

### 2. UI — card "Specified systems" devine clickabil
Modificări în `src/routes/projects.$projectId.specification.tsx`:

- Fiecare item din lista `fitzroviaSystems` devine `<button>` care deschide un dialog.
- Lângă nume afișăm un mic badge cu numărul de atașamente (`📎 3`) dacă există.
- Adăugăm un ribbon discret colorat (verde dacă are >0 atașamente, gri dacă nu) — feedback vizual rapid pentru "ce e documentat".

### 3. Dialog nou — `src/components/specification/SystemDetailsDialog.tsx`
Conținut:

**Header**: numele sistemului + arie + (dacă `canSeeMoney`) valoare.

**Tab 1 — Overview**:
- Descriere tehnică (textarea editabilă, salvare cu debounce / buton Save).
- Notes pentru șantier (textarea separată).
- Read-only pentru roluri fără `edit.specification` (vezi mai jos permission).

**Tab 2 — Documents** (`attachments`):
- Drop-zone + buton "Upload files" (`<input type="file" multiple>`).
- Fiecare upload primește un select de categorie (Datasheet / Certificate / Drawing / Test report / Photo / Other) + câmp opțional de notes.
- Lista existentă: icon per mime-type (FileText / Image / etc. din lucide), filename, size, categorie (badge colorat), uploader + data, butoane Download (link `<a download>` din dataUrl) și Delete (cu confirmare).
- Group-by category cu separatoare.

**Tab 3 — Build-up** (read-only):
Dacă numele sistemului face match în `LIBRARY` (systemLibrary.ts), arătăm `buildUp` table + `perf` (fire/Rw/maxHeight). Dacă nu, afișăm "No library match — use Description tab to document the build-up".

### 4. Permissions
- **Read** (deschide dialog, vede atașamente): toți userii care văd deja pagina (Site User & Operative incluși — e operațional, util pe șantier).
- **Upload / Edit notes / Delete**: gated cu `useCan("edit.specification")`. Dacă nu există capability-ul, îl adăugăm în `permissions.ts` mapat pe `Admin`, `Pro Control`, `Pro`. Site User și Operative văd doar read-only (download permis, upload/delete ascuns).

### 5. Update audit & teste
- `scripts/audit-rbac.mjs`: nimic de schimbat (ruta rămâne deschisă, gating e intern).
- `src/lib/permissions.test.ts`: adaug case pentru `edit.specification`.
- Test nou pentru `systemDetails.ts` (save/load/add/remove attachment, limita 5MB respinge).

## Detalii tehnice

**De ce localStorage + base64**: aliniat cu pattern-ul existent (bespokeSystems, projectData, customProjects, invoiceRegistry — toate folosesc localStorage). Nu e backend real în acest demo. Limita 5MB e suficientă pentru PDF-uri de datasheet uzuale; documentăm explicit limita în UI.

**Cheie de identificare system**: folosim `name` din `fitzroviaSystems` ca `systemKey`. Stabil cât timp numele nu se schimbă; suficient pentru mock.

**Mime-type → icon**: helper mic în dialog (`pdf` → FileText roșu, `image/*` → Image, default → File).

**Hartă atașament → badge**: pe card afișăm doar count total. În dialog vedem detaliile.

## Fișiere atinse
- `src/lib/systemDetails.ts` (nou)
- `src/lib/systemDetails.test.ts` (nou)
- `src/components/specification/SystemDetailsDialog.tsx` (nou)
- `src/routes/projects.$projectId.specification.tsx` (modificat — card devine interactiv)
- `src/lib/permissions.ts` (adaug `edit.specification` capability)
- `src/lib/permissions.test.ts` (test nou)

## Out of scope (pot fi follow-up)
- Sync cu un backend real (ar înlocui localStorage cu Lovable Cloud storage + DB).
- Versionare documente (rev 1, rev 2…).
- Comments / @mentions pe atașamente.
- Aplicarea aceluiași pattern la alte locuri unde apare lista de sisteme (Catalog detail, Calculator). Putem extinde dacă e nevoie după ce confirmăm UX-ul aici.
