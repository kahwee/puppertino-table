# Releasing Puppertino Table

The initial candidate is `@kahwee/puppertino-table@0.1.0`. Preparation does not publish the package or create a release tag.

## Prepare

1. Pull main and use the Node and pnpm versions in `package.json`.
2. Update `package.json` and `CHANGELOG.md` together for subsequent versions.
3. Run `pnpm install --frozen-lockfile` and `pnpm check`.
4. Confirm `git diff --exit-code -- dist` and review the working tree.
5. Run `npm publish test-results/package/kahwee-puppertino-table-0.1.0.tgz --dry-run --ignore-scripts --access public`, adjusting the filename to the version being released.

The package check creates the tarball after `prepack` rebuilds the library. It checks the allowlist and installs the artifact in fresh React 18 and React 19 projects, compiles their typed imports, renders a locally sorted table on the server, and resolves the CSS export. The package keeps React, TanStack Table and Puppertino external.

Alternatively, dispatch **Prepare npm package** on the intended main commit. Download `npm-release-candidate` and review `pack.json`. Publish that verified tarball rather than repacking a different checkout.

## Publish when authorized

For the first release, an npm account with permission to publish to the `@kahwee` scope must authenticate with `npm login`. Keep two-factor authentication enabled and supply an OTP if npm requests one. Credentials are not needed for preparation and must not be committed.

```sh
npm whoami --registry=https://registry.npmjs.org/
npm publish test-results/package/kahwee-puppertino-table-0.1.0.tgz --ignore-scripts --access public
npm view @kahwee/puppertino-table@0.1.0 version dist.integrity --registry=https://registry.npmjs.org/
```

When using a downloaded artifact, substitute its local tarball path. `--ignore-scripts` publishes the already verified artifact without rerunning repository hooks.

After confirming npm lists the version, create the corresponding `v0.1.0` tag and GitHub release on the verified commit, and update the README's pending-release wording. Never move a published version's tag or attempt to overwrite an npm version.

For later automated releases, configure npm trusted publishing for this repository and a dedicated publishing workflow after the package exists. The preparation workflow intentionally has no npm token, write permissions or publish command; its only npm publish invocation uses `--dry-run`.
