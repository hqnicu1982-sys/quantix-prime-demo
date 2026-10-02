# Rebuild the FixMargin public cover

## Goal
Replace `/welcome` completely with the approved light/dark reference design, preserving its exact structure, wording, colours, and public links while adding restrained one-time motion.

## What will change
- Rebuild the page as one standalone cover with the approved header, hero, four-phase strip, four detailed product stories, roles, pricing summary, closing call-to-action, and footer.
- Remove the previous carousel, role switcher, feature grid, floating cards, glass effects, serif typography, and all previous welcome-page copy.
- Replace the old welcome-only styles with exact Geist typography, supplied light/dark tokens, phase colours, inverted blocks, mobile navigation, hover states, and responsive layouts.
- Keep `/welcome` public and without the application sidebar or header. No other page will change.

## Interaction and motion
- Use a one-time intersection observer for section and card reveals.
- Reveal the four phase cards left-to-right and draw their coloured bars.
- Sequence the estimate checks, exact buy-value counters and call-off chips, Gantt bars, phone form fields and PDF pulse, then the invoice mismatch evidence.
- Disable all motion under `prefers-reduced-motion`, showing every element immediately in its final state.
- Use CSS `prefers-color-scheme` only; do not read the saved application theme or depend on the `.dark` class.

## Navigation and content
- Use the exact approved copy, including the manufacturer-system count and “Coming next” sentence.
- Drive Resources from one enabled/disabled list; only How-to guides will render today.
- Wire Sign in, Start free, Demo, Pricing, legal links, and in-page Product/On site/Roles anchors exactly as requested.
- Add an accessible mobile menu while keeping Sign in visible at 390px.
- Set the requested title, description, canonical, Open Graph URL, Open Graph text, and Twitter card metadata for `https://fixmargin.com/`.

## Validation
- Check desktop at 1280px and phone at 390px in both OS themes.
- Check reduced-motion rendering in its complete final state.
- Confirm exactly one H1, no horizontal overflow, working menu and links, no console errors, and a clean current preview build.
- Capture screenshots for the final report and identify any mismatch that remains.
