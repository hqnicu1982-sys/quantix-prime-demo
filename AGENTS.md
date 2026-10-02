# Project architecture rules

- Keep the Harbour Yard sample baseline in `src/lib/sampleProjectData.ts`; sample registries consume it by project ID so real-project data remains unchanged.
- Keep public role previews presentation-only and permission-aware; they must never imply access beyond the application's enforced role model.
- Keep `/demo` as a bare public entry that uses mock authentication and marks only auto-entered sessions for the persistent demo notice.
