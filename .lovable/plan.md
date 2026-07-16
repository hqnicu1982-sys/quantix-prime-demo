## Revert avatar colors in HeaderUserMenu

Restore the initials-avatar styling in `src/components/auth/HeaderUserMenu.tsx` to its pre-today state: a flat neutral chip, not the per-tier gradient added in the last change.

### Change

In `src/components/auth/HeaderUserMenu.tsx`:
- Remove the `AVATAR_TONE` map added earlier today.
- Restore the avatar `<div>` inside the "View as" list to its original className:
  ```
  flex h-5 w-5 items-center justify-center rounded-full bg-[var(--ink-100)] text-[9.5px] font-bold text-[var(--ink-700)]
  ```
- Leave the tier badges (Admin / Pro Control / Pro / Operative) untouched — only the SM/DP/RO/NA/PW/MK/AJ initial circles revert.
- Leave the top-right header avatar (with the accent→teal gradient) untouched — it existed before today.

No other files change.
