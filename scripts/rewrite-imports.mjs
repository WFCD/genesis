#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const roots = ['shared', 'bot', 'worker', 'spec'];
const sharedModules = ['settings', 'utilities', 'resources', 'embeds', 'types'];
const sharedModels = ['Build', 'JoinableRole', 'RaidStat'];

const walk = (dir, files = []) => {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, files);
    else if (/\.(js|ts)$/.test(entry.name)) files.push(full);
  }
  return files;
};

const rewrite = (content) => {
  let next = content;
  for (const mod of sharedModules) {
    next = next.replace(new RegExp(`from ['"](?:\\.\\./)+${mod}/`, 'g'), `from '#shared/${mod}/`);
  }
  for (const model of sharedModels) {
    next = next.replace(
      new RegExp(`from ['"](?:\\.\\./)+models/${model}\\.js['"]`, 'g'),
      `from '#shared/models/${model}.js'`
    );
  }
  next = next.replace(
    /from ['"]\.\/src\/bot\.js['"]/g,
    "from '../bot/bot.js'"
  );
  next = next.replace(
    /from ['"]\.\.\/src\/resources\//g,
    "from '#shared/resources/"
  );
  next = next.replace(
    /from ['"]\.\.\/src\/eventHandlers\//g,
    "from '../bot/eventHandlers/"
  );
  return next;
};

for (const root of roots) {
  if (!fs.existsSync(root)) continue;
  for (const file of walk(root)) {
    const original = fs.readFileSync(file, 'utf8');
    const updated = rewrite(original);
    if (updated !== original) fs.writeFileSync(file, updated);
  }
}

console.log('Import rewrite complete');
