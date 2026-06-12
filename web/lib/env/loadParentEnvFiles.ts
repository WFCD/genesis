import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

/** Load repo-root env files when web-local vars are unset (e.g. `.env.local.docker` with TOKEN). */
export function loadParentEnvFiles(webRoot = process.cwd()) {
  const candidates = [resolve(webRoot, '../.env.local.docker'), resolve(webRoot, '../.env.local')];
  for (const filePath of candidates) {
    if (!existsSync(filePath)) continue;
    const content = readFileSync(filePath, 'utf8');
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
}
