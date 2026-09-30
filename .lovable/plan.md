# Complete the Harbour Yard sample project

## Goal
Finish the existing fictional sample only, using the supplied Harbour Yard, Northgate, merchant, supervisor, and crew details. Real projects and their data remain unchanged.

## Implementation
1. **Correct the sample identity and headline metrics**
   - Rename it to “Harbour Yard Offices — Levels 2–3 fit-out” and use the exact subtitle and contractor.
   - Set contract value to £104,800, retention to 3%, progress to 42%, margin to 18.4%, healthy status, and dates relative to today (start −6 weeks, completion +8 weeks).
   - Give the sample overview its own health/activity data, including one amber Meridian dispute, so it never falls back to unrelated demo content.

2. **Create one canonical sample dataset**
   - Add the five walls-only British Gypsum systems and the exact 14 BoQ material quantities.
   - Add the three named merchant quotes, exact comparison totals, best-mix split, saving, incomplete Northway line, MANUAL/AUTO choices, and the three teaching traps.
   - Seed sample-only call-offs, signed/short GRNs, the Meridian disputed invoice, two variations, two payment applications, five site reports, crew activity, planner tasks/dependencies/milestones, and 7/7 setup state.
   - Make seeding idempotent and reset-compatible so “Reset sample” restores the supplied baseline.

3. **Render the complete example across existing project tabs**
   - Show sample-specific systems and performance details on Specification.
   - Show the full quote comparison and fix-data affordance on Costed BoQ.
   - Reuse existing Call-offs, Invoices, Variations, Payments, Reports, and Planner views with sample-scoped seeded records.
   - Preserve editable demo behaviour without affecting non-sample records.

4. **Finish sample safeguards and labels**
   - Block credit-note verification using the existing refused-action treatment.
   - Add the Sample badge to every project picker found in the app.
   - Remove unrelated names from every sample-visible surface; site reports use Dan Mercer and crews use fictional first names only.

5. **Verify**
   - Check the sample overview and each populated tab in the browser on desktop and mobile.
   - Verify relative dates, exact totals, 7/7 setup, the amber dispute, blocked credit verification, and Sample badges.
   - Run focused tests and confirm the preview build is clean.

## Technical details
- Sample fixtures will be isolated behind `sample-harbour-yard` checks and existing localStorage registries.
- Existing registry field shapes remain unchanged; no dependencies or backend changes are needed.
- Where an existing model cannot express a display-only teaching detail cleanly, the sample route will render a sample-specific section rather than altering real-project logic.
