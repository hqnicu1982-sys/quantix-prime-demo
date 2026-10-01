# Rebuild /welcome — "Data-First Precision" direction

Rebuild the public marketing homepage `/welcome` following the approved prototype (v2, Data-First Precision), keeping all existing routing, guard and head-meta behaviour unchanged.

## Locked design decisions (user-approved)

- Palette: navy `#0A1D33` / `#0F2847` hero and audience sections, blue `#2563EB` accent, `#F1F5F9` light sections, white cards.
- Typography: **Lato** (300/400/700/900) throughout the page — user reference: chalkstring.com. Load via `<link>` in the route's `head()` links (not `@import` in CSS).
- Structure: hero (2 columns, BoQ mock right) → problem (3 cards) → **zigzag how-it-works** (4 alternating text/mock rows with big ghost step numbers 01–04) → roles band on navy → CTA card (blue, rounded, soft glow) → footer.
- Register: data-first, precise, trade-serious; subtle motion only (fade-up on scroll, soft hover lift).

## File changes

1. `src/routes/welcome.tsx` — full rewrite of the page component per the approved prototype, with these corrections (prototype content that violates the project's content rules must NOT ship):
   - Top bar stays: FixMargin logo (existing `Logo` component), Pricing (/pricing), Sign in (/login), primary "Start free" (/signup).
   - Hero headline/subline: product-accurate (price from manufacturer systems, compare merchant price lists on the same BoQ, check every invoice against order + delivery). No "the only platform"-style superlative claims. CTAs: "Start free" → /signup, "See pricing" → /pricing.
   - BoQ mock: reuse the app's existing fictional sample dataset (Gyproc WallBoard / Gypframe stud / FireLine rows; Castlegate · Meridian · Northway) with best-price highlighting and a "Sample data" label — same numbers already shown on the current page (totals £37,354 / £37,347 / £37,187; best mix saves £2,450, labelled sample figures).
   - Problem section: 3 cards (merchant prices drift · invoices paid unchecked · variations erode margin), white cards on `#F1F5F9` with restrained icon treatment (blue, not red-alert styling).
   - Zigzag: 4 steps (manufacturer take-off → costed BoQ comparison → call-offs & GRNs → invoice check before payment), each with an HTML/CSS mock card (mini price grid, call-off/GRN row, invoice check panel) — no placeholder boxes like "Manufacturer Integration Mockup".
   - Roles band on navy: MD / Commercial Director / Estimator-QS / Buyer, one line each.
   - "Also included" compact feature grid (Variations log, Daily site reports, Planner, Profit forecast, Team roles and permissions, CSV export) — keep from current page, restyled to this direction.
   - CTA card: "Start free — no card required" → /signup; secondary "Compare plans" → /pricing. No demo/walkthrough wording, no "join contractors"-style social proof.
   - Footer: links Pricing, Privacy, Terms, Cookies, Sign in; legal line "FixMargin is a trading name of Quantix Prime Ltd. Registered in England and Wales, company number 16680674." and © 2026.
   - Head meta unchanged: existing title/description/og tags preserved; add the Lato font `<link>`.
   - Fully responsive, mobile-first; mock tables scroll inside their cards on mobile; exactly one h1, one h2 per section.
   - No prices on the page other than the labelled sample BoQ figures; no invented statistics, testimonials, customer logos or review stars; no accounting-integration claims.

2. No other routes, guards, `PUBLIC_PATHS`, AppLayout behaviour, or head metadata are modified. `/welcome` stays in `PUBLIC_PATHS` and renders standalone (no sidebar/header) — already working, keep as-is.

## Verification

- `bunx tsgo --noEmit` passes.
- Playwright check signed-out: /welcome renders on desktop and mobile, no console errors, no horizontal overflow, sections in order, sample data labelled, footer legal line present.
