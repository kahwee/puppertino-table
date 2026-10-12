# Releasing Puppertino Table

The initial candidate is `puppertino-table@0.1.0`. Preparation does not publish the package or create a release tag.

## Prepare

1. Pull main and use the Node and pnpm versions in `package.json`.
2. Update `package.json` and `CHANGELOG.md` together for subsequent versions.
3. Run `pnpm install --frozen-lockfile` and `pnpm check`.
4. Confirm `git diff --exit-code -- dist` and review the working tree.
5. Run `pnpm publish test-results/package/puppertino-table-0.1.0.tgz --dry-run --ignore-scripts --access public`, adjusting the filename to the version being released.

The package check creates the tarball after `prepack` rebuilds the library. It checks the allowlist and installs the artifact in fresh React 18 and React 19 projects, compiles their typed imports, renders a locally sorted table on the server, and resolves the CSS export. The package keeps React, TanStack Table and Puppertino external.

Alternatively, dispatch **Prepare npm package** on the intended main commit. Download `npm-release-candidate` and review `pack.json`. Publish that verified tarball rather than repacking a different checkout.

## Publish when authorized

For the first release, use the existing pnpm session authenticated as `kahwee`, after verifying the unscoped package name is available. pnpm 11+ publishes natively and its session can differ from the separate npm CLI credential. Keep two-factor authentication enabled; the owner must complete any publishing approval while the pnpm command remains running. If approval times out, check the registry before retrying. Credentials are not needed for preparation and must not be committed.

```sh
pnpm whoami --registry=https://registry.npmjs.org/
pnpm publish test-results/package/puppertino-table-0.1.0.tgz --ignore-scripts --access public
pnpm view puppertino-table@0.1.0 version dist.integrity --registry=https://registry.npmjs.org/
```

When using a downloaded artifact, substitute its local tarball path. `--ignore-scripts` publishes the already verified artifact without rerunning repository hooks.

After confirming npm lists the version, create the corresponding `v0.1.0` tag and GitHub release on the verified commit, and update the README's pending-release wording. Never move a published version's tag or attempt to overwrite an npm version.

For later automated releases, configure npm trusted publishing for this repository and a dedicated publishing workflow after the package exists. The preparation workflow intentionally has no npm token, write permissions or publish command; its only pnpm publish invocation uses `--dry-run`.
