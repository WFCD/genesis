#!/usr/bin/env node
// Docker release copies only root node_modules + dist. Nested workspace installs
// under packages/*/node_modules are invisible to Node resolving from dist/*.
// Fail CI when the lockfile records such nests.
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const lockPath = join(root, 'package-lock.json');
const lock = JSON.parse(readFileSync(lockPath, 'utf8'));
const packages = lock.packages ?? {};

const nested = Object.keys(packages)
  .filter((key) => /^packages\/[^/]+\/node_modules\//.test(key))
  .sort();

if (nested.length === 0) {
  console.log('OK: no nested packages/*/node_modules entries in package-lock.json');
  process.exit(0);
}

console.error('Nested workspace dependencies in package-lock.json:\n');
for (const key of nested) {
  const version = packages[key]?.version ?? '?';
  console.error(`  ${key} @ ${version}`);
}

console.error(`
These nest under packages/*/node_modules. Docker release only ships root
node_modules, so dist/* cannot resolve them (ERR_MODULE_NOT_FOUND).

Fix locally (regen + dedupe to hoist):

  rm -rf node_modules packages/*/node_modules package-lock.json \\
    && npm install \\
    && npm dedupe

If nests remain, align conflicting versions across workspaces/root
(semver clash forces nest). Then commit the updated package-lock.json.
`);

process.exit(1);
