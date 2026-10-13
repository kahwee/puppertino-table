import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { appendFile, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

export const repository = 'kahwee/puppertino-table';
export const packageName = 'puppertino-table';
export const registry = 'https://registry.npmjs.org/';
const stable = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/;

export function validateRelease({ event, sha, head, tagSha, manifest }) {
  assert.equal(event.action, 'published', 'Only published GitHub releases may publish');
  assert.equal(event.repository.full_name, repository, 'Wrong repository');
  assert.equal(event.repository.id, 1414928171, 'Repository identity changed');
  assert.equal(event.release.draft, false, 'Draft releases cannot publish');
  assert.equal(event.release.prerelease, false, 'Prereleases cannot publish');
  const tag = event.release.tag_name;
  assert.equal(typeof tag, 'string');
  const version = tag.startsWith('v') ? tag.slice(1) : '';
  assert.match(version, stable, 'Tag must be v followed by a stable SemVer');
  const [major, minor, patch] = version.split('.').map(Number);
  assert.ok(
    major > 0 || minor > 1 || (minor === 1 && patch > 0),
    'This future workflow must never publish 0.1.0 or older',
  );
  assert.match(sha, /^[a-f0-9]{40}$/, 'Release event must identify an exact commit');
  assert.equal(head, sha, 'Checkout differs from release event SHA');
  assert.equal(tagSha, sha, 'Release tag moved or points to a different commit');
  assert.equal(manifest.name, packageName, 'Wrong npm package');
  assert.equal(manifest.version, version, 'Tag/version mismatch');
  assert.equal(manifest.repository.url, `https://github.com/${repository}.git`);
  assert.equal(manifest.packageManager, 'pnpm@11.25.0');
  assert.deepEqual(manifest.publishConfig, { access: 'public', registry });
  assert.equal(manifest.private, false);
  return { version, sha, tarball: `puppertino-table-${version}.tgz` };
}

export function registryState(status, metadata, packed) {
  if (status === 404) return 'missing';
  assert.equal(status, 200, `Registry lookup failed (${status}); refusing to publish`);
  assert.equal(metadata.name, packageName);
  assert.equal(metadata.version, packed.version);
  assert.equal(
    metadata.dist.integrity,
    packed.integrity,
    'Existing version has different bytes; never overwrite it',
  );
  return 'existing';
}

const git = (...args) => execFileSync('git', args, { encoding: 'utf8' }).trim();
async function context() {
  const event = JSON.parse(await readFile(process.env.GITHUB_EVENT_PATH, 'utf8'));
  const tag = event.release.tag_name;
  assert.match(tag, /^v(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/);
  const manifest = JSON.parse(await readFile('package.json', 'utf8'));
  const release = validateRelease({
    event,
    sha: process.env.GITHUB_SHA,
    head: git('rev-parse', 'HEAD'),
    tagSha: git('rev-parse', `refs/tags/${tag}^{commit}`),
    manifest,
  });
  git('merge-base', '--is-ancestor', release.sha, 'origin/main');
  const remote = git('ls-remote', '--tags', 'origin', `refs/tags/${tag}`, `refs/tags/${tag}^{}`);
  const refs = new Map(
    remote
      .split('\n')
      .map((line) => line.split(/\s+/))
      .map(([sha, ref]) => [ref, sha]),
  );
  assert.equal(
    refs.get(`refs/tags/${tag}^{}`) || refs.get(`refs/tags/${tag}`),
    release.sha,
    'Remote tag no longer matches event SHA',
  );
  return release;
}

async function output(values) {
  if (process.env.GITHUB_OUTPUT)
    await appendFile(
      process.env.GITHUB_OUTPUT,
      Object.entries(values)
        .map(([key, value]) => `${key}=${value}\n`)
        .join(''),
    );
  console.log(JSON.stringify(values));
}

async function packedAt(filename) {
  const packed = JSON.parse(await readFile(filename, 'utf8'));
  const release = await context();
  assert.equal(packed.id, `${packageName}@${release.version}`);
  assert.equal(packed.filename, release.tarball);
  if (process.env.EXPECTED_INTEGRITY)
    assert.equal(
      packed.integrity,
      process.env.EXPECTED_INTEGRITY,
      'Downloaded artifact differs from verified build',
    );
  const tarball = path.join(path.dirname(filename), packed.filename);
  const bytes = await readFile(tarball);
  assert.equal(createHash('sha1').update(bytes).digest('hex'), packed.shasum);
  assert.equal(`sha512-${createHash('sha512').update(bytes).digest('base64')}`, packed.integrity);
  const files = execFileSync('tar', ['-tzf', tarball], { encoding: 'utf8' }).trim().split('\n');
  const entries = execFileSync('tar', ['-tvzf', tarball], { encoding: 'utf8' }).trim().split('\n');
  assert.ok(
    entries.every((entry) => entry.startsWith('-')),
    'Archive must contain only regular files',
  );
  const allowed = (file) =>
    ['package.json', 'README.md', 'LICENSE', 'CHANGELOG.md'].includes(file) ||
    /^dist\/[a-z-]+\.(js|d\.ts|css)$/.test(file);
  assert.deepEqual(
    files.map((file) => file.replace(/^package\//, '')).sort(),
    packed.files.map((file) => file.path).sort(),
  );
  for (const file of files) {
    assert.ok(
      file.startsWith('package/') && allowed(file.slice(8)),
      `Unwanted tarball entry: ${file}`,
    );
    const body = execFileSync('tar', ['-xOzf', tarball, file], { encoding: 'utf8' });
    assert.ok(
      !/npm_[A-Za-z0-9]{30,}|gh[pousr]_[A-Za-z0-9]{30,}|-----BEGIN .*PRIVATE KEY|\/Users\/|AKIA[0-9A-Z]{16}/.test(
        body,
      ),
      `Sensitive content in ${file}`,
    );
  }
  const manifest = JSON.parse(
    execFileSync('tar', ['-xOzf', tarball, 'package/package.json'], { encoding: 'utf8' }),
  );
  assert.equal(manifest.name, packageName);
  assert.equal(manifest.version, release.version);
  assert.equal(manifest.repository.url, `https://github.com/${repository}.git`);
  assert.deepEqual(manifest.publishConfig, { access: 'public', registry });
  return packed;
}

async function lookup(packed) {
  const response = await fetch(`${registry}${encodeURIComponent(packageName)}/${packed.version}`, {
    signal: AbortSignal.timeout(15000),
    headers: { accept: 'application/json' },
  });
  const metadata = response.status === 200 ? await response.json() : null;
  return { state: registryState(response.status, metadata, packed), metadata };
}

async function main() {
  const [mode, filename = 'test-results/package/pack.json'] = process.argv.slice(2);
  if (mode === 'validate-event') return output(await context());
  const packed = await packedAt(filename);
  if (mode === 'validate-packed') return output({ integrity: packed.integrity });
  if (mode === 'registry-state') return output({ state: (await lookup(packed)).state });
  assert.equal(mode, 'verify-registry');
  for (let attempt = 0; attempt < 180; attempt++) {
    const result = await lookup(packed);
    if (result.state === 'existing') {
      await writeFile(
        path.join(path.dirname(filename), 'registry.json'),
        `${JSON.stringify(result.metadata, null, 2)}\n`,
      );
      return output({
        version: packed.version,
        integrity: packed.integrity,
        registryVerified: true,
      });
    }
    await new Promise((resolve) => setTimeout(resolve, 5000));
  }
  throw new Error(
    'Upload may be accepted but registry availability is unconfirmed; inspect registry before any retry',
  );
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) await main();
