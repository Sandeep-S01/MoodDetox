import { existsSync, rmSync } from 'node:fs';
import { resolve } from 'node:path';

const targets = ['.next', 'out', 'dist'];

for (const target of targets) {
  const path = resolve(process.cwd(), target);
  if (existsSync(path)) {
    rmSync(path, { recursive: true, force: true });
    console.log(`Removed ${target}`);
  }
}
