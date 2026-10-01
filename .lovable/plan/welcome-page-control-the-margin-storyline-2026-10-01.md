# Welcome page — Control the margin storyline

## Objective
Rebuild `/welcome` around the complete FixMargin project lifecycle, using the approved dark cinematic direction without making the page feel like a BoQ product page.

## Page structure
1. **Hero: Control the margin from estimate to final account**
   - Keep the dark navy/cyan visual system and existing headline, supporting copy, and calls to action.
   - Replace the large BoQ table with a compact project-control overview: forecast margin, project progress, one delivery warning, one invoice dispute, and one unsigned variation.
   - Use the BoQ only as one small input signal, labelled with fictional sample data.

2. **Connected control strip**
   - Show the full operating chain in one horizontal sequence: Estimate → Procurement → Site → Commercial → Final account.
   - Connect each stage visually with restrained cyan lines and status markers.

3. **Feature stories with real product UI fragments**
   - **Estimate and procurement:** specification/take-off, supplier comparison, call-off approval.
   - **Site delivery control:** delivery status, GRN shortfall, daily report, access delay.
   - **Commercial control:** invoice three-way check, dispute, signed and unsigned variations, payment application/retention.
   - **Programme and margin:** planner delay, milestone status, overdue action, margin forecast.
   - Each story gets equal visual weight, plain British-English copy, and fictional “Sample data” labels.

4. **Operational coverage grid**
   - Replace the minimal “Also included” rows with richer compact previews for Drawing revisions, Daily reports, Planner, Variations, Payment applications, Profit forecast, Tender handoff, Team permissions, and CSV/PDF/XLSX exports.

5. **Audience, CTA, footer**
   - Keep role-specific cards but align each role to the broader workflow, not only estimating and buying.
   - Preserve existing sign-up/pricing links and legal company wording.

## Visual treatment
- Keep the NEXUS-inspired dark navy field, cyan/blue light, glass panels, fine grid and restrained motion.
- Create depth through connected floating interface fragments rather than a single oversized table.
- Maintain strong contrast, clear hierarchy, mobile-first stacking, and reduced-motion support.
- No new statistics, customer claims, testimonials, prices, integrations, names, companies, or addresses.

## Scope
- Change only the `/welcome` presentation and its welcome-specific style rules.
- Do not alter dashboard pages, authentication, public-route behaviour, product data, or business logic.

## Validation
- Check desktop and mobile layouts in the browser with no horizontal overflow.
- Confirm one `h1`, one `h2` per section, all sample data visibly labelled, links correct, and no console or build errors.
