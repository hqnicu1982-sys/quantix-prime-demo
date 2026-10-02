# Public demo entry

## Build
- Add `/demo` as a bare public loading page that uses the existing mock demo sign-in and redirects to `/`.
- Skip sign-in when a session already exists, without ever rendering the login form.
- Point all `/welcome` demo links to `/demo`.
- Mark the auto-created demo session so the app can show a persistent sample-data notice with a `/signup` link; clear that marker on normal sign-in, sign-up, and sign-out.

## Integration
- Add `/demo` to the existing public-route handling so it can run before authentication.
- Keep the notice limited to auto-entered demo sessions and preserve every other page and authentication flow.

## Verification
- Start from empty browser storage, click “Explore the demo”, and confirm the dashboard opens without visiting or showing `/login`.
- Confirm the demo notice appears, existing sessions redirect directly, the preview has no console errors, and the build remains healthy.
