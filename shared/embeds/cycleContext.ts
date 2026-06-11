import { wikiBase } from '#shared/utilities/CommonFunctions';

export const hubBase = process.env.HUB_BASE_PATH || 'https://hub.warframestat.us';

export const hubMaps = {
  cetus: `${hubBase}/poe/map`,
  vallis: `${hubBase}/vallis/map`,
  cambion: `${hubBase}/deimos/map`,
} as const;

type CycleContext = {
  duration: string;
  summary: string;
  tips: string[];
  wiki: string;
  map?: string;
};

export const formatCycleLinks = ({ map, wiki }: Pick<CycleContext, 'wiki' | 'map'>) =>
  map ? `[Hub Map](${map}) • [Wiki Guide](${wiki})` : `[Wiki Guide](${wiki})`;

const cetusDay: CycleContext = {
  duration: '100 minutes',
  summary: 'Plains of Eidolon day — best window for fishing, mining, and Ostron bounties.',
  tips: [
    'Eidolon hunts only spawn at **night**; use day cycles to prepare lures and amps.',
    'Most fish species and mining veins are easier to reach without night-level Grineer.',
    'Konzu bounties refresh on their own timer — check hub map for mining and fishing spots.',
  ],
  wiki: `${wikiBase}Plains_of_Eidolon`,
  map: hubMaps.cetus,
};

const cetusNight: CycleContext = {
  duration: '50 minutes',
  summary: 'Plains of Eidolon night — Eidolon hunts and higher threat in the open plains.',
  tips: [
    '**Eidolon hunts** begin at the first lake east of Cetus (Teralyst and beyond).',
    'Fewer fish spawns; Grineer and Tusk Thumpers run higher levels.',
    'Bring an amp and lures; hub map marks lakes, caves, and resource routes.',
  ],
  wiki: `${wikiBase}Plains_of_Eidolon/Eidolon_Hunt`,
  map: hubMaps.cetus,
};

const earthDay: CycleContext = {
  duration: '4 hours',
  summary: 'Earth day cycle — daylight tilesets on Earth missions.',
  tips: [
    'Affects lighting on Earth mission nodes (not the open-world plains).',
    'Some bounties and tileset spawns rotate with the global Earth clock.',
  ],
  wiki: `${wikiBase}Earth`,
};

const earthNight: CycleContext = {
  duration: '4 hours',
  summary: 'Earth night cycle — darker Earth mission tilesets.',
  tips: [
    'Earth nodes use night lighting until the next day transition.',
    'Pair with `/cycle cetus` for Plains of Eidolon day/night timers.',
  ],
  wiki: `${wikiBase}Earth`,
};

const vallisCold: CycleContext = {
  duration: '20 minutes',
  summary: 'Orb Vallis cold — calmer wildlife and reduced Orb Mother patrol.',
  tips: [
    '**Conservation** animals are easier to track; some species only appear in cold.',
    'Cold lakes and ponds host different servofish — Shockprod or Stunna spears required.',
    'Use the hub map for cave, fishing, and K-drive marker locations.',
  ],
  wiki: `${wikiBase}Orb_Vallis`,
  map: hubMaps.vallis,
};

const vallisWarm: CycleContext = {
  duration: '~6.5 minutes',
  summary: 'Orb Vallis warm — Thermia activity, hotspots, and tougher fauna.',
  tips: [
    '**Thermia fractures** and Orb Mother activity spike during warm cycles.',
    'Warm ponds unlock alternate servofish; bait and hotspot markers on hub map.',
    'Conservation targets are more alert — approach slowly or use Tranq rifles.',
  ],
  wiki: `${wikiBase}Orb_Vallis/Thermia_Fractures`,
  map: hubMaps.vallis,
};

const cambionFass: CycleContext = {
  duration: '100 minutes',
  summary: 'Fass cycle — aggressive Infested and caustic Fass residue buildup.',
  tips: [
    '**Fass residue** applies Caustic stacks; stand in **Vome residue** to cleanse them.',
    'Infested are more aggressive; mix residue at collection points for standing.',
    'Isolation Vaults and Necramech farming stay available — hub map marks caves and gates.',
  ],
  wiki: `${wikiBase}Cambion_Drift`,
  map: hubMaps.cambion,
};

const cambionVome: CycleContext = {
  duration: '50 minutes',
  summary: 'Vome cycle — safer Drift period and common window for Mother bounties.',
  tips: [
    '**Vome residue** protects against Fass caustic — safer for vault and bounty runs.',
    'Mother bounties and Iso vault tiers are often scheduled during Vome.',
    'Fish, mine, and farm Necralisk standing; hub map shows obelisks and blinkpads.',
  ],
  wiki: `${wikiBase}Cambion_Drift/Map`,
  map: hubMaps.cambion,
};

export const getCetusCycleContext = (isDay: boolean) => (isDay ? cetusDay : cetusNight);

export const getEarthCycleContext = (isDay: boolean) => (isDay ? earthDay : earthNight);

export const getVallisCycleContext = (isWarm: boolean) => (isWarm ? vallisWarm : vallisCold);

export const getCambionCycleContext = (state: string) =>
  state?.toLowerCase() === 'fass' ? cambionFass : cambionVome;

export const formatCycleTips = (tips: string[]) => tips.map((tip) => `• ${tip}`).join('\n');
