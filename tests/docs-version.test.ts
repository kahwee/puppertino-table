import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const { version } = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
test('README installation commands pin the current package version', () => {
  const readme = readFileSync(new URL('../README.md', import.meta.url), 'utf8');
  const commands = [
    ...readme.matchAll(
      /(?:pnpm add|npm (?:i|install)|yarn add|bun add)\s+puppertino-table@([^\s`]+)/g,
    ),
  ];
  assert.ok(commands.length, 'README must contain a versioned installation command');
  for (const [, pinned] of commands) assert.equal(pinned, version);
});
