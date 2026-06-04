import { cpSync, globSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { defineConfig } from 'tsup';

const root = path.dirname(fileURLToPath(import.meta.url));
const distRoot = path.join(root, 'dist');
const sharedDistRoot = path.join(distRoot, 'shared');

const collectEntries = (pattern: string, exclude: string[] = []) =>
  globSync(pattern, {
    cwd: root,
    exclude: ['**/*.d.ts', ...exclude],
  });

const entries = [
  ...new Set([
    'bot/main.ts',
    'worker/main.ts',
    ...collectEntries('bot/**/*.ts'),
    ...collectEntries('worker/**/*.ts'),
    ...collectEntries('shared/**/*.ts', ['shared/tools/**']),
  ]),
];

const copyResourceAssets = () => {
  const resourceRoot = path.join(root, 'shared/resources');
  for (const jsonFile of globSync('**/*.json', { cwd: resourceRoot })) {
    const src = path.join(resourceRoot, jsonFile);
    const dest = path.join(sharedDistRoot, 'resources', jsonFile);
    mkdirSync(path.dirname(dest), { recursive: true });
    cpSync(src, dest);
  }
};

const toRelativeSharedImport = (fromFile: string, sharedSubpath: string) => {
  const target = path.join(sharedDistRoot, sharedSubpath);
  let relative = path.relative(path.dirname(fromFile), target).replace(/\\/g, '/');
  if (!relative.startsWith('.')) relative = `./${relative}`;
  return relative;
};

const rewriteSharedImports = () => {
  const sharedImportPattern = /#shared\/([^'"]+)/g;

  for (const file of globSync('**/*.js', { cwd: distRoot, exclude: ['**/*.map'] })) {
    const absoluteFile = path.join(distRoot, file);
    let content = readFileSync(absoluteFile, 'utf8');
    let changed = false;

    content = content.replace(sharedImportPattern, (match, sharedSubpath: string) => {
      changed = true;
      return toRelativeSharedImport(absoluteFile, sharedSubpath);
    });

    if (changed) writeFileSync(absoluteFile, content);
  }
};

const hasExplicitExtension = (specifier: string) => /\.(js|json|node|mjs|cjs)$/.test(specifier);

/** Node ESM requires explicit extensions; source uses extensionless relative imports. */
const addRelativeImportExtensions = () => {
  const importPattern = /(\bfrom\s+|\bimport\s*\(\s*|\bexport\s+(?:\{[^}]*\}|\*)\s+from\s+)(['"])((\.\.?\/)[^'"]+)\2/g;

  for (const file of globSync('**/*.js', { cwd: distRoot, exclude: ['**/*.map'] })) {
    const absoluteFile = path.join(distRoot, file);
    let content = readFileSync(absoluteFile, 'utf8');
    let changed = false;

    content = content.replace(importPattern, (match, prefix, quote, specifier) => {
      if (hasExplicitExtension(specifier)) return match;
      changed = true;
      return `${prefix}${quote}${specifier}.js${quote}`;
    });

    if (changed) writeFileSync(absoluteFile, content);
  }
};

export default defineConfig({
  entry: entries,
  outDir: 'dist',
  format: ['esm'],
  platform: 'node',
  target: 'node24',
  bundle: false,
  splitting: false,
  sourcemap: true,
  clean: true,
  dts: false,
  shims: false,
  async onSuccess() {
    copyResourceAssets();
    rewriteSharedImports();
    addRelativeImportExtensions();
  },
});
