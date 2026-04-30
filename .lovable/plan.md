# Connect the Interim Payment Application workflow end-to-end

After a dependency sweep, the Payment Application module is functional in isolation but has 9 disconnects with Variations, Invoice Registry, Financial Dashboard, Project Overview, Reports și project lifecycle. Below is the fix plan, scoped strictly to closing those gaps.

## Disconnects found

```text
                       CURRENT                              ISSUE
Variations.approved  ─/ ─►  PaymentApplication.lines       no auto-pull
PaymentNotice                                              ok
PayLessNotice        ─►  cert.finalAmount (manual)         ok but no UI hint
Certificate          ─►  invoiceRegistry.add               ok
RecordPayment        ─/ ─►  invoiceRegistry.markPaid       MIRROR STAYS OPEN
DeleteApplication    ─/ ─►  invoiceRegistry cleanup        ORPHAN MIRROR
DeleteCustomProject  ─/ ─►  paymentCycle storage           ORPHAN STORAGE
Financial dashboard  ─/ ─►  payment cycle KPIs             missing
Project overview     ─/ ─►  payment cycle KPI row          missing
Reports tab          ─/ ─►  cashflow forecast              missing
NewApplicationDialog ─/ ─►  prev-certified live refresh    stale on reopen
```

## What gets built / changed

### 1. Cross-module helpers (`src/lib/paymentCycle.ts`)
- New `recordPayment` flow now also accepts an optional `mirrorInvoiceRef` so the caller can mark the mirrored invoice paid. Add an internal `findMirrorByCertNumber(pid, certNumber)` helper (lookup în invoiceRegistry by reference).
- `deleteApplication` extended to delete any mirrored invoice (matched by `certificateNumber`).
- New helper `previouslyCertifiedLive(pid)` — same as today plus pending `noticed` apps optional flag — exposed for the dialog.
- New aggregate `getApprovedVariationLines(pid)` (lives în paymentCycle, imports from variations) returns suggested `PaymentLine[]` from approved-but-not-yet-included variations.

### 2. Invoice Registry (`src/lib/invoiceRegistry.ts`)
- Add `markPaidByReference(reference)` and `deleteByReference(reference)` so paymentCycle can sync without exposing IDs.

### 3. Variations ↔ Applications wiring (`src/components/payments/NewApplicationDialog.tsx`)
- On open, fetch approved variations for the project and offer a "Pull approved variations" button that appends them as `category: "variations"` lines (deduped by VO id captured in description prefix `[VO-001]`).
- `previouslyCertified` re-reads on every open via `useEffect` (currently captured in initial `useState` only).

### 4. Record Payment closes the loop (`src/components/payments/IssueNoticeDialogs.tsx`)
- `RecordPaymentDialog` calls `markPaidByReference(certificateNumber)` after `recordPayment` so Invoices tab and cashflow drop the mirror correctly.
- `CertificateDialog` shows a banner when a Pay Less Notice exists, pre-filling `finalAmount = certifiedAmount − withholding`.

### 5. Payment cycle on Project Overview (`src/routes/projects.$projectId.index.tsx`)
- Add a compact "Payment cycle" KPI strip (Applied / Certified / Outstanding / Next notice due) that links to the Payments tab. Gated by `view.payments`.

### 6. Reports tab (`src/routes/projects.$projectId.reports.tsx`)
- Embed `<CashflowForecastCard ... />` în Reports (full version), and a small "Interim payments status" tile (counts by status + outstanding £).

### 7. Financial Dashboard (`src/routes/financial.tsx`)
- Add a fourth KPI row for Payment Applications Pipeline (Applied YTD vs Certified YTD vs Paid YTD vs Outstanding) using `usePaymentTotals(current.id)`.

### 8. Project lifecycle (`src/lib/customProjects.ts` or `src/lib/paymentCycle.ts`)
- Export `clearPaymentCycle(pid)` and call it from `deleteCustomProject` to avoid orphan localStorage. Same für invoiceRegistry mirrors of that project.

### 9. Tests (`src/lib/paymentCycle.test.ts` — new)
- Unit tests for `buildForecast` already exist? if not, smoke test for: variation pull-in produces correct line, recordPayment cascades to invoice mirror, delete cascades to mirror.

## Files touched

**New**
- `src/lib/paymentCycle.test.ts`

**Edited**
- `src/lib/paymentCycle.ts` (helpers, delete cascade, variation bridge)
- `src/lib/invoiceRegistry.ts` (`markPaidByReference`, `deleteByReference`)
- `src/components/payments/NewApplicationDialog.tsx` (variation pull-in + live prev-certified)
- `src/components/payments/IssueNoticeDialogs.tsx` (record-payment cascade, pay-less hint în cert dialog)
- `src/routes/projects.$projectId.index.tsx` (payment cycle KPI row)
- `src/routes/projects.$projectId.reports.tsx` (cashflow forecast embed + status tile)
- `src/routes/financial.tsx` (payment pipeline KPIs)
- `src/lib/customProjects.ts` (cleanup hooks on delete)

## Out of scope
- No DB / Cloud persistence (still mock localStorage as today).
- No new permissions added (existing capabilities cover all touchpoints).
- No redesign of existing UI surfaces — only additive cards / wiring.

Aprobi să implementez exact pașii de mai sus?
