#!/usr/bin/env node
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const root = join(import.meta.dirname, '..');
const staticDir = join(root, '.next/static');

const forbidden = [
  /BOT_TOKEN/i,
  /DISCORD_CLIENT_SECRET/i,
  /AUTH_SECRET/i,
  /Authorization:\s*Bot/i,
  /discord\.js/,
  /node:fs/,
];

function walk(dir, files = []) {
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    const stat = statSync(path);
    if (stat.isDirectory()) walk(path, files);
    else if (/\.(js|mjs|cjs)$/.test(entry)) files.push(path);
  }
  return files;
}

if (!statSync(staticDir, { throwIfNoEntry: false })) {
  console.error('Missing .next/static — run `npm run build` first.');
  process.exit(1);
}

const hits = [];
for (const file of walk(staticDir)) {
  const content = readFileSync(file, 'utf8');
  for (const pattern of forbidden) {
    if (pattern.test(content)) {
      hits.push({ file: file.replace(`${root}/`, ''), pattern: String(pattern) });
    }
  }
}

if (hits.length) {
  console.error('Possible secrets or server code in client static bundles:');
  for (const hit of hits) console.error(`  ${hit.file} matched ${hit.pattern}`);
  process.exit(1);
}

console.log('Client bundle secret scan passed.');
