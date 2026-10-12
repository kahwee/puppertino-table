import { execFileSync } from 'node:child_process';
import { copyFile, rm } from 'node:fs/promises';

await rm('dist', { recursive: true, force: true });
execFileSync(process.execPath, ['node_modules/typescript/bin/tsc', '-p', 'tsconfig.build.json'], {
  stdio: 'inherit',
});
await copyFile('src/style.css', 'dist/style.css');
