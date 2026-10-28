# Puppertino Table

Portable React/TanStack Table components and gesture primitives styled with Puppertino. Keep application-specific documents, APIs, authentication and model logic outside this package.

- Use pnpm. Required checks: `pnpm check` (including Biome lint/format checks). Use `pnpm format` for safe formatting/import/lint fixes; keep any suppressions local and justified. Generated dist is excluded from Biome and must come from the build. Commit pnpm-lock.yaml.
- React, React Table and Puppertino are peer dependencies; emit unbundled JavaScript so consumers share their React/TanStack instance.
- Keep React and React DOM on the supported React 19 line, with matching development and consumer versions. Do not widen peers or change runtime-major contracts as routine dependency maintenance.
- Controlled manual sorting must not reorder already paginated server data. Selection never grants authorization.
- Only completed resize gestures persist. Escape, pointer cancellation, unmount, disabled mode and configured responsive transitions cancel unfinished changes.
- Subscribe to sizing separately from the memoized row body; preserve keyboard and semantic accessibility.
- Commit generated dist for Git installation and verify it matches the build. Never commit secrets, uploaded documents, demo build output or test artifacts.
- This is a public MIT-licensed library. Do not publish npm releases without an explicit request.
