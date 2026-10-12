# Releasing Puppertino Table

`puppertino-table@0.1.0` is published and verified from npm. Preparation commands do not publish another version or create a release tag.

## Prepare

1. Pull main and use the Node and pnpm versions in `package.json`.
2. Update `package.json` and `CHANGELOG.md` together for subsequent versions.
3. Run `pnpm install --frozen-lockfile` and `pnpm check`.
4. Confirm `git diff --exit-code -- dist` and review the working tree.
5. Run `pnpm publish test-results/package/puppertino-table-0.1.0.tgz --dry-run --ignore-scripts --access public`, adjusting the filename to the version being released.

The package check creates the tarball after `prepack` rebuilds the library. It checks the allowlist and installs the artifact in fresh React 18 and React 19 projects, compiles their typed imports, renders a locally sorted table on the server, and resolves the CSS export. The package keeps React, TanStack Table and Puppertino external.

Alternatively, dispatch **Prepare npm package** on the intended main commit. Download `npm-release-candidate` and review `pack.json`. Publish that verified tarball rather than repacking a different checkout.

## Publish when authorized

For the first release, use the existing pnpm session for an npm account with permission to publish to the `@kahwee` scope. pnpm 11 publishes natively; its working session can differ from the separate npm CLI credential. Keep two-factor authentication enabled. The owner must complete any browser publishing approval while the command remains running. Credentials are not needed for preparation and must not be committed.

```sh
pnpm whoami --registry=https://registry.npmjs.org/
pnpm view puppertino-table@0.1.0 version dist.integrity --registry=https://registry.npmjs.org/
# Publish only if the exact version is absent. Keep this terminal running during approval.
pnpm publish test-results/package/puppertino-table-0.1.0.tgz --ignore-scripts --access public --registry=https://registry.npmjs.org/
pnpm view puppertino-table@0.1.0 version dist.integrity --registry=https://registry.npmjs.org/
```

When using a downloaded artifact, substitute its local tarball path. `--ignore-scripts` publishes the already verified artifact without rerunning repository hooks.

After confirming npm lists the version, create the corresponding `v0.1.0` tag and GitHub release on the verified commit, and update the README's pending-release wording. Never move a published version's tag or attempt to overwrite an npm version.

If approval times out, check the exact registry version before retrying. A pending or accepted upload must never be submitted again. Confirm registry integrity against the reviewed `pack.json`, then run `node scripts/check-package.mjs --from-registry` to install that exact npm version in clean React 18 and React 19 consumers.

## Future GitHub Release publishing

The approved `.github/workflows/publish-npm.yml` is installed in this repository. npm trusted publishing must be configured separately when the next release is ready. It runs only for a published stable GitHub Release in `kahwee/puppertino-table`. It rejects draft/prerelease releases, version 0.1.0 or older, tag/version mismatches, a changed tag, a checkout differing from the event SHA, or a release commit outside main. The SHA is checked again immediately before publication.

The verification job uses Node **24.21.0** and pnpm **11.25.0**, the versions used by the successful preparation CI run. GitHub Actions are pinned to immutable commits. It runs release-guard tests plus `pnpm check`, including builds, browser tests, package allowlist checks, and isolated tarball consumers. The publish job downloads that exact artifact, rechecks its SHA-512 integrity and remote tag, and uses pnpm trusted OIDC with provenance. Only that job has `id-token: write`; it runs no dependency installation or lifecycle scripts. All jobs have only `contents: read` otherwise. Registry consumer checks run in a separate job without OIDC permission.

If a version already exists with the same integrity, the workflow verifies it and skips publishing. Different bytes under that version cause failure. Registry authentication, rate-limit and server errors also fail rather than being treated as a missing version. The initial 0.1.0 remains a manual release and cannot be replayed through this workflow.

### Exact trust values for the later approval

- npm package: `puppertino-table`
- Provider: GitHub Actions on GitHub-hosted runners
- Organization or user: `kahwee`
- Repository: `puppertino-table` (verified repository ID `1414928171`)
- Workflow filename: `publish-npm.yml` (filename only)
- Environment name: leave empty; the draft creates no GitHub environment
- Allowed actions: enable direct `npm publish`; do not enable independent dist-tag management. npm always allows staged publication on a trusted connection.

Saving this trust grants that workflow publishing access to this package. Pushing/enabling the workflow and saving the npm trust require a separate action-time approval. Do not change token/2FA settings or create credentials as part of this setup.

Wait until the **next new version** is ready before saving npm trust: a new unused connection expires if its first successful publish does not occur within two days. The current 0.1.0 does not require this trust.

### Next release after approval

1. Confirm 0.1.0 is published and consumer-tested. Review and approve activation of the exact workflow diff.
2. Choose a new stable version greater than 0.1.0; update `package.json` and `CHANGELOG.md`, run `node --test tests/release.test.mjs` and `pnpm check`, and commit the source plus matching generated `dist`. Preserve the pnpm lockfile.
3. Push the reviewed workflow and release commit to main. Verify the exact commit SHA and create a matching immutable `v<version>` tag on that SHA. Never move an existing tag.
4. Present the exact npm trust fields above for approval at the time of saving them, when the next release can complete within two days. The workflow file must already exist in GitHub before adding trust.
5. Publish a stable GitHub Release for that existing tag. Follow the verification, publish, and consumer jobs; confirm registry version/integrity and consumer results. On any uncertain upload result, inspect the registry before retrying.

Sources: [npm trusted publishing](https://docs.npmjs.com/trusted-publishers/) and [pnpm publish](https://pnpm.io/cli/publish). OIDC exchange itself cannot be tested until the owner approves trust and a new release is ready. The preparation workflow continues to have no publishing permission.
