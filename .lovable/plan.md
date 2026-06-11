## Goal

Standardize every "create / submit" flow in the app on a single, reusable **FormWizard** template, then build the four typed forms the user picked. Today the codebase has two ad-hoc wizards (`calloffs.new`, `invoices.new`), GRN sign-off lives only as a quick dialog (`LogGrnDialog`) with no full form page, Variation creation is a dialog (`NewVariationDialog`), and Daily Report is a free-form page.

## What gets built

### 1. Reusable template — `src/components/forms/FormWizard.tsx`

Generic stepper-form shell used by every form below. Props:
- `title`, `subtitle`, `workflowStrip?` (optional ReactNode shown above the wizard, e.g. `<WorkflowStrip />`)
- `steps: { id, label, render: () => ReactNode, canAdvance?: () => boolean }[]`
- `onSubmit`, `submitLabel`
- Optional `onCancel`, `sticky` footer

Internals: matches the visual language already used in `calloffs.new` / `invoices.new` (numbered chips, green check on completed, accent on current, `ChevronRight` between, sticky Back/Next/Submit row). Refactor those two existing wizards to consume the template so the look stays identical and we get a single source of truth.

Plus two small primitives reused by the forms:
- `src/components/forms/FormField.tsx` — `<Label>` + control + hint + error slot (already inline in `CallOffActionDialogs`, promoting it).
- `src/components/forms/SignaturePad.tsx` — canvas signature capture (mouse + touch), exposes `toDataURL()` and a Clear button. Pure client, no deps.
- `src/components/forms/PhotoDropzone.tsx` — multi-file image picker with thumbnail strip, base64-stored in form state (mock — same pattern as existing upload flows).

### 2. GRN — full sign-off form

Replace today's read-only `/grn/$ref` page with a tabbed view:
- **Summary** tab → current read-only content (kept verbatim).
- **Sign GRN** tab → `FormWizard` with steps:
  1. Goods received — editable line table (received qty per material, short/over flags), copies ordered qty from the linked call-off.
  2. Condition & notes — textarea + checkbox "partial delivery — keep call-off open for balance".
  3. Proof — `PhotoDropzone` (delivery photos) + delivery note ref + driver name.
  4. Sign & submit — `SignaturePad` + signed-by name (prefilled from `currentUser`) + date/time.

On submit: extend `grnRegistry.logGrn` (already exists) to accept `signature` (data URL), `photos` (string[]), `lines` (already supported), `deliveryNoteRef`, `driverName`. Mark status `received` when not partial, `partial` otherwise. Toast + route back to `/calloffs/$ref`.

Also add an entry point: `/grn/new?callOff=CO-246` route (and a "Sign GRN" button on the call-off detail page that opens the form pre-filled instead of the lightweight dialog). The existing `LogGrnDialog` stays for the quick-log path from list views, but the call-off detail CTA points to the full form.

### 3. Call-Off — refactor existing wizard onto the template

`src/routes/calloffs.new.tsx` keeps identical UX and submit logic but is rewritten to use `FormWizard` + `FormField`. No behavior changes, no new fields.

### 4. Invoice — refactor existing wizard onto the template

`src/routes/invoices.new.tsx` same treatment: rewrite to use `FormWizard`, no behavioral change.

### 5. Variation — new full-page form

New route `src/routes/variations.new.tsx` ("Raise variation" CTA from variations table and from the existing daily-report "raise variation" flow links here when the user wants the long form; the existing dialog stays for quick capture). Steps:
  1. Trigger — type (instruction / change / discrepancy), source (client, design, site), linked daily-report issue (optional).
  2. Scope & description — title, description, affected zones.
  3. Cost & time impact — labour hrs, materials £, plant £, prelims £, programme days delta (reuses `CostBreakdownPanel` calculation).
  4. Attachments & submit — `PhotoDropzone` + notes + submit.

On submit: call existing variations registry add helper used by `NewVariationDialog` (keep one source of truth — the dialog's submit handler is extracted into `src/lib/variations.ts` and both surfaces call it).

### 6. Daily Report — submit form

New route `src/routes/daily-report.new.tsx` (today's `daily-report.tsx` becomes a list/index of submitted reports — already partly wired via `dailyReportSubmissions`). Steps:
  1. Day & crew — date, shift, weather, headcount per trade.
  2. Progress — task progress lines (linked to planner tasks for the active project).
  3. Issues & blockers — list + severity + "raise variation" toggle (links to variation form pre-filled).
  4. Photos & sign-off — `PhotoDropzone` + `SignaturePad` (site manager) + submit.

On submit: append to `dailyReportSubmissions` registry (already persistent).

## Technical details

- All new files are pure presentation + localStorage writes; no backend.
- `grnRegistry`, `dailyReportSubmissions`, `variations` registries get small field additions (signature, photos, driverName, deliveryNoteRef) — added as optional so existing seeded data stays valid.
- `FormWizard` is generic, no router coupling, so it works inside both routes and dialogs if needed later.
- The two existing wizards are refactored in the same pass to prove the template; tests already covering their submit handlers continue to pass since handlers are untouched.

## Files

Created:
- `src/components/forms/FormWizard.tsx`
- `src/components/forms/FormField.tsx`
- `src/components/forms/SignaturePad.tsx`
- `src/components/forms/PhotoDropzone.tsx`
- `src/routes/grn.new.tsx`
- `src/routes/variations.new.tsx`
- `src/routes/daily-report.new.tsx`

Edited:
- `src/routes/grn.$ref.tsx` (add Sign GRN tab + entry point)
- `src/routes/calloffs.new.tsx` (refactor onto FormWizard)
- `src/routes/invoices.new.tsx` (refactor onto FormWizard)
- `src/routes/calloffs.$ref.tsx` (CTA → full GRN form)
- `src/routes/daily-report.tsx` (becomes list, links to `daily-report.new`)
- `src/routes/variations.tsx` + `src/routes/projects.$projectId.variations.tsx` (CTA → `variations.new`)
- `src/lib/grnRegistry.ts` (extra optional fields)
- `src/lib/variations.ts` (extract shared submit helper)
- `src/lib/dailyReportSubmissions.ts` (extra optional fields)
