## Ce construim

Un modul **Payments** per proiect care modelează ciclul JCT/NEC interim payment:

```text
[Subbie]  Application for Payment  ─┐
                                    ├─ due-date clock starts
[MC]      Payment Notice            │  (5 zile after due date)
[MC]      Pay Less Notice (opt.)    │  (≥1 zi before final date for payment)
[MC]      Certificate / Final Sum   ─┘
[MC]      Payment recorded          → mirror în invoice registry
```

Suma se introduce **manual per application** (per categorie: Preliminaries, Measured Work, Variations, Materials on Site, Retention, Previous Certified). Sistemul calculează "this application net" automat.

## Roluri & dual-side

Adăugăm pe project un câmp `ourRole: "main_contractor" | "subcontractor"` (default "subcontractor"; selectat în Project Settings). UI-ul se schimbă în funcție de rol:

- **Subcontractor side** (Pro Control + Operative pot crea draft, Admin submite): vezi Applications outgoing, Notices/Certificates primite.
- **Main Contractor side** (Admin/Pro Control issue Notices): vezi Applications incoming de la subbies, emite Payment Notice + Pay Less Notice + Certificate.

## Capabilities noi

În `src/lib/permissions.ts`:
- `view.payments` — toți cu acces la proiect
- `create.payment.application` — Pro Control + Admin (subbie side)
- `issue.payment.notice` — Admin + Pro Control (MC side)
- `record.payment` — Admin

Mapate în `TIER_CAPS` pentru fiecare tier existent.

## Data model (localStorage, mock — pattern identic cu `invoiceRegistry.ts`)

Fișier nou `src/lib/paymentCycle.ts`:

```ts
type PaymentApplication = {
  id, projectId, appNumber,           // "AFP-014"
  periodEnd: ISO, submittedAt: ISO,
  dueDate: ISO,                       // due date for payment notice (5 days)
  finalDateForPayment: ISO,           // typically +14/21 days
  lines: { category, gross, retentionPct }[],
  grossTotal, retentionHeld, previouslyCertified, netThisApp,
  status: "draft" | "submitted" | "noticed" | "certified" | "paid" | "disputed",
  noticeId?, certificateId?
}
type PaymentNotice = { id, applicationId, issuedAt, certifiedAmount, breakdown[], notes }
type PayLessNotice = { id, noticeId, issuedAt, withholdingAmount, reason }
type PaymentCertificate = { id, applicationId, finalAmount, issuedAt, paidAt? }
```

Hooks: `usePaymentApplications(projectId)`, `usePaymentDueDates(projectId)` (returns ce expiră în <7 zile).

## Rute & UI

**Tab nou** în `src/routes/projects.$projectId.tsx` array `TABS`:
```ts
{ key: "payments", label: "Payments", requires: "view.payments" }
```

Fișier nou `src/routes/projects.$projectId.payments.tsx`:
- **Header**: KPI cards — Total Applied YTD, Total Certified YTD, Outstanding, Next Due Date (cu countdown roșu/galben).
- **Timeline view**: lista Applications, fiecare expandable cu Notice + Pay Less + Certificate dedesubt.
- **Buton "New Application"** (subbie side) sau "Awaiting Application from..." (MC side).
- **Status pills** + due-date warnings ("Payment Notice due in 2 days").

## Dialoguri

`src/components/payments/`:
- `NewApplicationDialog.tsx` — formular cu line items pe categorii, calc auto net amount, validation Zod (nu negative, retention 0-10%).
- `IssuePaymentNoticeDialog.tsx` — pre-populat cu suma applied, MC editează cert amount + breakdown.
- `PayLessNoticeDialog.tsx` — withholding + reason (required).
- `RecordPaymentDialog.tsx` — paid date, amount, mirror în `invoiceRegistry`.

## Integrări (asta răspunde la "integra totul în workflow")

1. **Approval Inbox** (`ApprovalInboxCard.tsx`): adaug secțiune nouă pentru `issue.payment.notice` — "Applications awaiting your Notice (3)" + "Notices due in <3 days (1)".
2. **Variations link**: când o variation devine `approved`, devine eligibilă să apară ca line item în următoarea Application (checkbox "Include in next AFP").
3. **Invoice registry mirror**: când se emite un Certificate, creează automat o `RegistryInvoice` (receivable pentru subbie / payable pentru MC) cu reference = cert number. Un singur ledger de cashflow.
4. **Financial dashboard** (`projects.$projectId.reports.tsx` + `financial.tsx`): tile nou "Certified vs Applied" și "Cashflow forecast" bazat pe `finalDateForPayment`.
5. **Export pack** (`exportProjectPack.ts`): adaug secțiune "Payment History" cu lista applications + cert amounts.
6. **Notifications/Toasts**: la submit Application → toast "Payment Notice due by [date]". La 24h înainte de due → highlight roșu în sidebar badge (folosind `usePaymentDueDates`).

## Files to create / edit

**Create:**
- `src/lib/paymentCycle.ts`
- `src/routes/projects.$projectId.payments.tsx`
- `src/components/payments/NewApplicationDialog.tsx`
- `src/components/payments/IssuePaymentNoticeDialog.tsx`
- `src/components/payments/PayLessNoticeDialog.tsx`
- `src/components/payments/RecordPaymentDialog.tsx`
- `src/components/payments/PaymentTimeline.tsx`
- `src/components/payments/StatusBadge.tsx` (sau reuse existing)

**Edit:**
- `src/lib/permissions.ts` — 4 caps noi + mapare tiers
- `src/lib/ProjectContext.tsx` (sau `mockData.ts`) — câmp `ourRole` per project
- `src/routes/projects.$projectId.tsx` — tab nou
- `src/components/dashboard/ApprovalInboxCard.tsx` — secțiune nouă
- `src/lib/invoiceRegistry.ts` — funcție `createFromCertificate(cert)`
- `src/lib/exportProjectPack.ts` — secțiune Payment History
- `src/lib/variations.ts` — flag `includedInApplicationId?: string`

## Out of scope (pot urma în iterații separate)

- Auto-calc din BoQ % complete (am ales manual entry).
- Email notifications real (doar toasts în-app).
- PDF generation pentru Notice/Certificate (folosim doar export pack).
- Compliance certificates (fire/acoustic) — alt domeniu, alt modul.

Aprobi planul ca să încep implementarea?
