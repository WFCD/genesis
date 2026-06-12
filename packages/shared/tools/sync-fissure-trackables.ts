/**
 * Regenerate fissure tier×type entries in pingables.json + cachedEvents.json from missionTypes.json.
 *
 * Run: `npx tsx shared/tools/sync-fissure-trackables.ts`
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const resourcesDir = join(dirname(fileURLToPath(import.meta.url)), '../resources');

const missionTypes = JSON.parse(readFileSync(join(resourcesDir, 'missionTypes.json'), 'utf8')) as Record<
  string,
  { fissure?: boolean }
>;

const fissureTypes = Object.entries(missionTypes)
  .filter(([, meta]) => meta.fissure)
  .map(([type]) => type)
  .sort();

const tiers = [1, 2, 3, 4, 5, 6] as const;

const isFissureEntry = (entry: string) => entry === 'fissures' || entry.startsWith('fissures.');

const buildTierTypeKeys = (steelPath: boolean) => {
  const prefix = steelPath ? 'fissures.sp' : 'fissures';
  const keys: string[] = [];
  for (const tier of tiers) {
    for (const type of fissureTypes) {
      keys.push(`${prefix}.t${tier}.${type}`);
    }
  }
  return keys;
};

const buildPingableFissureKeys = () => {
  const keys: string[] = ['fissures'];
  for (const tier of tiers) {
    keys.push(`fissures.t${tier}`);
  }
  keys.push(...buildTierTypeKeys(false));
  keys.push('fissures.node', 'fissures.sp');
  for (const tier of tiers) {
    keys.push(`fissures.sp.t${tier}`);
  }
  keys.push(...buildTierTypeKeys(true));
  keys.push('fissures.sp.node');
  return keys;
};

const mergeAt = (entries: string[], insertKeys: string[]) => {
  const nonFissure = entries.filter((e) => !isFissureEntry(e));
  const insertAt = entries.findIndex((e) => isFissureEntry(e));
  const at = insertAt >= 0 ? insertAt : nonFissure.length;
  return [...nonFissure.slice(0, at), ...insertKeys, ...nonFissure.slice(at)];
};

const syncPingables = () => {
  const path = join(resourcesDir, 'pingables.json');
  const pingables = JSON.parse(readFileSync(path, 'utf8')) as string[];
  writeFileSync(path, `${JSON.stringify(mergeAt(pingables, buildPingableFissureKeys()), null, 2)}\n`);
};

const syncCachedEvents = () => {
  const path = join(resourcesDir, 'cachedEvents.json');
  const cached = JSON.parse(readFileSync(path, 'utf8')) as string[];
  writeFileSync(
    path,
    `${JSON.stringify(mergeAt(cached, [...buildTierTypeKeys(false), ...buildTierTypeKeys(true)]), null, 2)}\n`
  );
};

syncPingables();
syncCachedEvents();
process.stdout.write(
  `Synced ${fissureTypes.length} fissure mission types × ${tiers.length} tiers (+ node group pingables)\n`
);
