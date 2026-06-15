
# Drawing revisions & tender baseline

Adaug o secțiune nouă **„Drawing revisions"** în tab-ul existent `/projects/$projectId/specification`, deasupra listei „Specification documents". Documentele de spec (NBS, fire, acoustic) rămân unde sunt — desenele de arhitectură capătă tratament special cu numere de drawing, revizii grupate, baseline tender blocat și aprobare per revizie.

## Concept

Fiecare „drawing" e un grup logic identificat printr-un **drawing number** (ex. `A-201`, `M-110`). Sub el stau una sau mai multe **revizii** (`T1` tender, `C1`, `C2`…). Una singură e marcată `Current`; restul sunt istoric. Baseline-ul tender este înghețat când Admin/Pro apasă „Issue tender set" — după acel moment nimic nu mai poate șterge sau înlocui un fișier marcat tender, doar adăuga revizii noi peste.

## Model de date (`src/lib/drawingRegistry.ts`, localStorage)

```ts
type DrawingRevisionStatus = "pending" | "current" | "superseded" | "rejected";

type DrawingRevision = {
  id: string;
  drawingNumber: string;       // ex "A-201"
  revisionCode: string;        // ex "T1", "C1", "P02"
  isTender: boolean;           // true doar pentru revizia inclusă în tender baseline
  status: DrawingRevisionStatus;
  fileName: string; fileSize: number; mimeType: string; dataUrl: string;
  title?: string;              // ex "Level 04 GA"
  discipline: "Architect" | "Structural" | "MEP" | "Fire" | "Other";
  changeNotes?: string;        // ce s-a schimbat față de revizia anterioară
  affectedAreas?: string[];    // free tags ex ["L4 corridors", "Lift shaft"]
  uploadedBy: string; uploadedAt: number;
  approvedBy?: string; approvedAt?: number;
  rejectedReason?: string;
};

type DrawingsState = {
  tenderLocked: boolean;
  tenderIssuedAt?: number;
  tenderIssuedBy?: string;
  revisions: DrawingRevision[];
};
```

API: `getDrawings`, `useDrawings`, `addRevision`, `approveRevision`, `rejectRevision`, `issueTenderSet`, `groupByDrawing` (returnează `{ drawingNumber, current, tender, history[] }`).

## Permisiuni (`src/lib/permissions.ts`)

Adaug 3 capabilities noi:
- `upload.drawings` → Pro, Pro Control, Admin (Site nu mai poate urca desene, doar spec docs)
- `approve.drawings` → Pro Control, Admin
- `lock.tender` → Admin

Operative & Site văd doar reviziile `current` + tender, fără butoane.

## UI în Specification page

Card nou **„Drawing revisions"** plasat înaintea „Specification documents":

- **Header**: KPI mic — `12 drawings · 3 pending review · Tender locked 18 Apr`. Buton `Upload revision` (gated `upload.drawings`). Dacă tender nu e lock-uit: buton suplimentar `Issue tender set` (gated `lock.tender`) cu confirm dialog explicând că devine read-only.
- **Listă grupată pe drawing number** (acordeon): rândul principal arată `A-201 · Level 04 GA · Current: C2 · Tender: T1`. Pending reviziile au badge portocaliu „Awaiting approval".
- **Expand**: timeline vertical cu toate reviziile, status badge, uploader, date, change notes. Acțiuni per revizie: `Download`, `Compare with tender` (deschide viewer), `Approve` / `Reject` (gated).
- **Empty state** explică flow-ul: încarcă T1-uri → Issue tender → urcă C1/C2 când vin revizii.

## Upload dialog (`UploadDrawingRevisionDialog.tsx`)

Form cu validare zod:
- File picker (PDF, DWG, PNG, JPG; același `MAX_FILE_BYTES` ca spec docs)
- **Drawing number** (obligatoriu, regex `^[A-Z]{1,3}-\d{2,4}[A-Z]?$`, auto-uppercase). Dacă există deja, dialogul arată „Adding revision to existing drawing A-201 (current: C1)".
- **Revision code** (obligatoriu, max 6 chars). Dacă tender nu e încă issued: checkbox „Mark as tender revision" (default on).
- **Title** (opțional), **Discipline** (select).
- **Change notes** (obligatoriu pentru revizii post-tender; opțional pentru tender) + **Affected areas** (chip input).
- Dacă tender e lock-uit și user încearcă să încarce cu `isTender=true` → blocat client-side + server-side în `addRevision`.

Post-tender, reviziile noi intră cu `status: "pending"`. Pre-tender, intră direct `status: "current"`.

## Approval flow

- `Pro Control` / `Admin` văd în header card-ului „3 pending review" → click filtrează lista.
- Approve: revizia devine `current`, vechea `current` devine `superseded`. Toast cu link spre compare.
- Reject: cere motiv (textarea), revizia devine `rejected`, vechea `current` rămâne.

## Side-by-side viewer (`DrawingCompareDialog.tsx`)

Dialog full-screen (`max-w-[95vw] h-[90vh]`). Două panouri egale:
- Stânga: revizia tender (badge „Tender · T1 · 18 Apr").
- Dreapta: revizia selectată (badge „Current · C2 · 02 Jun").
- Pentru PDF: `<iframe src={dataUrl}>` cu `toolbar=0`. Pentru imagini: `<img>` cu wrapper zoom (`react-zoom-pan-pinch` deja-n stack? — dacă nu, controale custom +/- ca în diagrame).
- Zoom sincronizat opțional (toggle „Sync zoom" în header). Implementare: state comun `{scale, x, y}` propagat la ambele panouri când toggle e on.
- Footer: `change notes` ale reviziei curente + buton `Download both`.
- DWG: fallback „Preview not available — download to compare in CAD".

## Lock tender set

Confirm dialog: lista reviziilor marcate tender, avertisment „După lock, aceste fișiere devin read-only. Reviziile noi vor cere aprobare." Acțiunea setează `tenderLocked: true` + `tenderIssuedAt/By`. După lock:
- Butonul „Issue tender set" dispare.
- În locul lui apare un mic banner verde sub header: „Tender set issued 18 Apr by Sarah K · 8 drawings frozen".
- `addRevision` respinge orice request cu `isTender: true`.
- Delete pe revizii tender e blocat în UI + în registru.

## Integrare cross-module (light touch)

- **Variations** (`/projects/.../variations`): adaug un mic banner deasupra tabelului „2 drawing revisions pending review may affect pricing — review" → link spre tab-ul Specification cu anchor `#drawing-revisions`. Nu modific logica VO existentă, doar semnalizez.
- **Specification KPI strip**: KPI „Spec documents" rămâne; adaug unul nou „Drawing revisions" cu `total · X pending`.

## Fișiere

Noi:
- `src/lib/drawingRegistry.ts` — store + hooks
- `src/lib/drawingRegistry.test.ts` — lock invariants, group-by-drawing, approve/reject transitions
- `src/components/specification/DrawingRevisionsCard.tsx`
- `src/components/specification/UploadDrawingRevisionDialog.tsx`
- `src/components/specification/DrawingCompareDialog.tsx`
- `src/components/specification/IssueTenderSetDialog.tsx`

Modificate:
- `src/routes/projects.$projectId.specification.tsx` — adaug card + KPI
- `src/lib/permissions.ts` — 3 capabilities noi + maping per tier
- `src/routes/projects.$projectId.variations.tsx` — banner informativ
- `quantix_lovable_full_inventory.md` — secțiune nouă „Drawings registry"

## Seed pentru demo

8 drawings cu `T1` toate marcate tender + lock activ pe proiectul `camden`, plus 2 revizii `pending` (`A-201 C1` și `M-110 C2`) ca să se vadă imediat flow-ul de approval și compare. Pentru alte proiecte: empty state.

## Out of scope (explicit)

- Diff vizual automat între PDF-uri (overlay roșu/verde). Doar side-by-side manual.
- Detectare automată „ce linii BoQ sunt afectate". Affected areas e free-text acum.
- Watermark pe PDF, OCR pe revisions clouds.
