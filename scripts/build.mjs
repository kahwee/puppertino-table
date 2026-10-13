import { execFileSync } from 'node:child_process';
import { readFile, rm, writeFile } from 'node:fs/promises';

await rm('dist', { recursive: true, force: true });
execFileSync(process.execPath, ['node_modules/typescript/bin/tsc', '-p', 'tsconfig.build.json'], {
  stdio: 'inherit',
});
await writeFile(
  'dist/style.css',
  `${await readFile('src/style.css', 'utf8')}\n${await readFile('src/finder.css', 'utf8')}`,
);
