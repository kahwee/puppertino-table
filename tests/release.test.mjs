import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { registryState, validateRelease } from '../scripts/release-guards.mjs';

const sha = 'a'.repeat(40);
const valid = () => ({
  event: {
    action: 'published',
    repository: { full_name: 'kahwee/puppertino-table', id: 1414928171 },
    release: { tag_name: 'v0.1.1', draft: false, prerelease: false },
  },
  sha,
  head: sha,
  tagSha: sha,
  manifest: {
    name: 'puppertino-table',
    version: '0.1.1',
    repository: { url: 'https://github.com/kahwee/puppertino-table.git' },
    private: false,
    packageManager: 'pnpm@12.11.2',
    publishConfig: { access: 'public', registry: 'https://registry.npmjs.org/' },
  },
});
test('stable tagged release identifies its exact verified commit and artifact', () => {
  assert.deepEqual(validateRelease(valid()), {
    version: '0.1.1',
    sha,
    tarball: 'puppertino-table-0.1.1.tgz',
  });
});
for (const [name, change] of [
  [
    'draft',
    (value) => {
      value.event.release.draft = true;
    },
  ],
  [
    'prerelease',
    (value) => {
      value.event.release.prerelease = true;
    },
  ],
  [
    'non-stable tag',
    (value) => {
      value.event.release.tag_name = 'v0.1.1-rc.1';
    },
  ],
  [
    'tag injection',
    (value) => {
      value.event.release.tag_name = 'v0.1.1; echo bad';
    },
  ],
  [
    'initial release replay',
    (value) => {
      value.event.release.tag_name = 'v0.1.0';
      value.manifest.version = '0.1.0';
    },
  ],
  [
    'wrong repository',
    (value) => {
      value.event.repository.full_name = 'someone/puppertino-table';
    },
  ],
  [
    'recreated repository',
    (value) => {
      value.event.repository.id = 1;
    },
  ],
  [
    'wrong package',
    (value) => {
      value.manifest.name = '@someone/puppertino-table';
    },
  ],
  [
    'tag/version mismatch',
    (value) => {
      value.manifest.version = '0.1.2';
    },
  ],
  [
    'wrong checkout',
    (value) => {
      value.head = 'b'.repeat(40);
    },
  ],
  [
    'moved release tag',
    (value) => {
      value.tagSha = 'b'.repeat(40);
    },
  ],
  [
    'different registry',
    (value) => {
      value.manifest.publishConfig.registry = 'https://example.com/';
    },
  ],
])
  test(`rejects ${name} before publishing`, () => {
    const value = valid();
    change(value);
    assert.throws(() => validateRelease(value));
  });
const packed = { version: '0.1.1', integrity: 'sha512-verified' };
const metadata = {
  name: 'puppertino-table',
  version: '0.1.1',
  dist: { integrity: packed.integrity },
};
test('only a real registry 404 permits a new upload', () => {
  assert.equal(registryState(404, null, packed), 'missing');
  for (const status of [401, 403, 429, 500, 503])
    assert.throws(() => registryState(status, null, packed));
});
test('same existing artifact is verified instead of republished', () =>
  assert.equal(registryState(200, metadata, packed), 'existing'));
test('different bytes or wrong version never qualify as an existing release', () => {
  assert.throws(() =>
    registryState(200, { ...metadata, dist: { integrity: 'sha512-different' } }, packed),
  );
  assert.throws(() => registryState(200, { ...metadata, version: '0.1.2' }, packed));
});

test('CLI validates a real tagged artifact and rejects download tampering and a moved remote tag', async () => {
  const temporary = await mkdtemp(path.join(tmpdir(), 'puppertino-release-gates-'));
  try {
    const directory = path.join(temporary, 'source');
    const remote = path.join(temporary, 'remote.git');
    await mkdir(directory);
    const run = (...args) =>
      execFileSync('git', args, { cwd: directory, encoding: 'utf8', stdio: 'pipe' }).trim();
    run('init', '--bare', '--initial-branch=main', remote);
    run('init', '--initial-branch=main');
    run('config', 'user.name', 'Release Guard Test');
    run('config', 'user.email', 'release-test@example.invalid');
    const manifest = {
      ...valid().manifest,
      files: ['dist', 'LICENSE', 'README.md', 'CHANGELOG.md'],
    };
    await writeFile(path.join(directory, 'package.json'), JSON.stringify(manifest));
    for (const name of ['README.md', 'LICENSE', 'CHANGELOG.md'])
      await writeFile(path.join(directory, name), 'Synthetic release fixture\n');
    await mkdir(path.join(directory, 'dist'));
    await writeFile(path.join(directory, 'dist/index.js'), 'export const fixture = 1;\n');
    await writeFile(path.join(directory, 'dist/index.d.ts'), 'export declare const fixture: 1;\n');
    await writeFile(path.join(directory, 'dist/style.css'), '.pt-fixture {}\n');
    run('add', '.');
    run('commit', '-m', 'Synthetic stable release');
    const commit = run('rev-parse', 'HEAD');
    run('tag', '-a', 'v0.1.1', '-m', 'Synthetic tag');
    run('remote', 'add', 'origin', remote);
    run('push', 'origin', 'main', 'refs/tags/v0.1.1');
    const eventPath = path.join(temporary, 'event.json');
    await writeFile(eventPath, JSON.stringify(valid().event));
    const env = {
      ...process.env,
      GITHUB_SHA: commit,
      GITHUB_EVENT_PATH: eventPath,
      GITHUB_OUTPUT: path.join(temporary, 'outputs'),
    };
    delete env.EXPECTED_INTEGRITY;
    const guard = fileURLToPath(new URL('../scripts/release-guards.mjs', import.meta.url));
    const guardRun = (mode, filename, extra = {}) =>
      execFileSync(process.execPath, [guard, mode, ...(filename ? [filename] : [])], {
        cwd: directory,
        env: { ...env, ...extra },
        encoding: 'utf8',
        stdio: 'pipe',
      });
    assert.equal(JSON.parse(guardRun('validate-event')).sha, commit);
    const artifacts = path.join(temporary, 'artifacts');
    await mkdir(artifacts);
    const [packed] = JSON.parse(
      execFileSync(
        'npm',
        [
          'pack',
          '--json',
          '--ignore-scripts',
          '--pack-destination',
          artifacts,
          '--cache',
          path.join(temporary, 'npm-cache'),
        ],
        { cwd: directory, encoding: 'utf8', stdio: 'pipe' },
      ),
    );
    const packPath = path.join(artifacts, 'pack.json');
    await writeFile(packPath, JSON.stringify(packed));
    assert.equal(
      JSON.parse(guardRun('validate-packed', packPath, { EXPECTED_INTEGRITY: packed.integrity }))
        .integrity,
      packed.integrity,
    );
    assert.throws(() =>
      guardRun('validate-packed', packPath, { EXPECTED_INTEGRITY: 'sha512-changed' }),
    );
    const tarball = path.join(artifacts, packed.filename);
    const bytes = await readFile(tarball);
    await writeFile(tarball, Buffer.concat([bytes, Buffer.from('changed')]));
    assert.throws(() => guardRun('validate-packed', packPath));
    await writeFile(tarball, bytes);
    run('commit', '--allow-empty', '-m', 'Synthetic next commit');
    const moved = run('rev-parse', 'HEAD');
    run('push', 'origin', 'main');
    execFileSync('git', ['--git-dir', remote, 'update-ref', 'refs/tags/v0.1.1', moved], {
      stdio: 'pipe',
    });
    run('checkout', '--detach', commit);
    assert.throws(
      () => guardRun('validate-event'),
      (error) => /Remote tag no longer matches/.test(error.stderr.toString()),
    );
  } finally {
    await rm(temporary, { recursive: true, force: true });
  }
});
