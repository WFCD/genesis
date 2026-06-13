import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

/** Walk up from `startDir` to the npm workspaces root (repo root). */
export function findMonorepoRoot(startDir = process.cwd()): string {
  let dir = resolve(startDir);
  while (true) {
    const pkgPath = resolve(dir, 'package.json');
    if (existsSync(pkgPath)) {
      try {
        const pkg = JSON.parse(readFileSync(pkgPath, 'utf8')) as { workspaces?: unknown };
        if (pkg.workspaces) return dir;
      } catch {
        // ignore invalid package.json
      }
    }
    const parent = dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
}

function applyEnvFile(content: string) {
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (process.env[key] === undefined || process.env[key] === '') {
      process.env[key] = value;
    }
  }
}

/** Load repo-root `.env.local` without overriding vars already set (e.g. SCOPE from npm scripts). */
export function loadParentEnvFiles(cwd = process.cwd()) {
  const filePath = resolve(findMonorepoRoot(cwd), '.env.local');
  if (!existsSync(filePath)) return;
  applyEnvFile(readFileSync(filePath, 'utf8'));
}

loadParentEnvFiles();
