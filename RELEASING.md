# Releasing Puppertino Table

Stable versions of the public `puppertino-table` package publish through `.github/workflows/publish-npm.yml` when an authorized stable GitHub Release is published. The existing npm trusted publisher supplies OIDC authentication and provenance; no npm token or additional trust setup is needed.

## Prepare an authorized release

1. Confirm the requested version is absent from both npm and GitHub. Never overwrite a version or move an existing tag.
2. Update `package.json`, `CHANGELOG.md`, and README install examples together. Preserve `pnpm-lock.yaml`; use the pinned pnpm version.
3. Run `pnpm install --frozen-lockfile` when dependencies change, then `pnpm check`. Review source, exports/types, peer dependencies, license, README and the tarball file allowlist. The checks install the artifact into isolated React 19.3.0 consumers and test types, rendering and CSS.
4. Commit the source and matching generated `dist`, push main, and wait for verification and Storybook deployment to pass. Confirm the exact remote SHA.
5. Create an immutable annotated `v<version>` tag on that verified SHA, push it, and publish a stable GitHub Release. This requires an explicit owner request to publish.

## Publishing and verification

The release workflow uses Node 24.21.0, pnpm 11.25.0, and actions pinned to immutable commits. Its verification job validates the repository, stable tag, event SHA, main ancestry, package version and tarball. It runs release-guard tests and `pnpm check` and uploads the verified artifact.

Only the publish job receives `id-token: write`; other jobs receive `contents: read`. The publish job downloads the exact artifact, rechecks its SHA-512 integrity and remote tag, and publishes with pnpm OIDC and provenance. It installs no dependencies and runs no lifecycle scripts. The separate consumer job installs the public registry version with React 19.3.0, verifies typed imports, server rendering and CSS, and receives no OIDC permission.

If the version already exists with the same integrity, the workflow verifies it and skips publication. Different bytes under an existing version fail. Authentication, rate-limit and server errors fail rather than being treated as an absent version. The original manual 0.1.0 release cannot be replayed through this workflow.

After the run, compare registry metadata and SHA1/SHA512 against its downloaded `pack.json` and tarball. Confirm npm `latest`, provenance, all three workflow jobs, and the clean registry consumers. On any uncertain upload result, inspect the registry before retrying; never submit an accepted version again. Rerun failed verification or consumer jobs only after resolving their failure.

## Existing trusted publisher

- Package: `puppertino-table`
- Provider: GitHub Actions on GitHub-hosted runners
- Owner/repository: `kahwee/puppertino-table` (repository ID `1414928171`)
- Workflow filename: `publish-npm.yml`
- Environment: empty
- Allowed actions: direct `npm publish` and npm's always-enabled staged publication; independent dist-tag management is disabled

Keep existing token and two-factor authentication settings unchanged. Changing the trust connection is a separate security-sensitive action that requires action-time approval. Do not create credentials or expand access as a release workaround.

The manually dispatched **Prepare npm package** workflow remains available for review-only candidates and has no publishing permission.

Sources: [npm trusted publishing](https://docs.npmjs.com/trusted-publishers/) and [pnpm publish](https://pnpm.io/cli/publish).
