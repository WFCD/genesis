import qEngine from 'json-query';
import fetch from 'node-fetch';

import type { Logger } from '#shared/types/logger';

import { apiCacheTtlMs, getOrFetch, readCache, readStaleCacheSync, writeCache } from './ApiDiskCache';
import { apiBase } from './CommonFunctions';

const relicBase = 'https://drops.warframestat.us/data/relics';
const catalogLanguage = 'en';

const weaponsUrl = `${apiBase}/weapons/?language=${catalogLanguage}`;
const itemsUrl = `${apiBase}/items/?language=${catalogLanguage}`;
const warframesUrl = `${apiBase}/warframes/?language=${catalogLanguage}`;
const modsUrl = `${apiBase}/mods/?language=${catalogLanguage}`;

const indexKeys = {
  warframes: 'catalog-index:warframes',
  weapons: 'catalog-index:weapons',
  mods: 'catalog-index:mods',
} as const;

const toTitleCase = (str: string) =>
  str.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substring(1).toLowerCase());

async function fetchJson(url: string) {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`${res.status} ${res.statusText} for ${url}`);
  }
  return res.json();
}

type CatalogItem = Record<string, unknown> & {
  uniqueName?: string;
  name?: string;
  type?: string;
  patchlogs?: unknown;
};

export type CatalogIndexEntry = {
  uniqueName: string;
  name: string;
  type?: string;
};

type CatalogKind = keyof typeof indexKeys;

const buildIndex = (items: CatalogItem[]) =>
  items
    .filter((item) => item.uniqueName)
    .map((item) => ({
      uniqueName: String(item.uniqueName),
      name: String(item.name ?? item.uniqueName),
      ...(item.type ? { type: String(item.type) } : {}),
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

const mergeWeaponCatalog = (weapons: CatalogItem[], items: CatalogItem[]) => [
  ...weapons,
  ...items.filter((item) => item?.uniqueName?.includes('OperatorAmplifiers')),
];

/** Data interaction layer for requesting data from the WorldState API */
export default class WorldStateClient {
  #logger: Logger;

  static #warframeIndex: CatalogIndexEntry[] | undefined;

  static #weaponIndex: CatalogIndexEntry[] | undefined;

  static #modIndex: CatalogIndexEntry[] | undefined;

  static #fullCatalogCache = new Map<CatalogKind, CatalogItem[]>();

  static #initPromise: Promise<void> | undefined;

  constructor(logger: Logger = console as unknown as Logger) {
    this.#logger = logger;
    WorldStateClient.#ensureLoaded(logger);
  }

  static whenReady() {
    return WorldStateClient.#initPromise ?? Promise.resolve();
  }

  static #ensureLoaded(logger: Logger) {
    if (WorldStateClient.#warframeIndex) return;
    if (!WorldStateClient.#initPromise) {
      WorldStateClient.#initPromise = WorldStateClient.#warmCatalog(logger).catch((err) => {
        WorldStateClient.#initPromise = undefined;
        throw err;
      });
    }
  }

  static async #loadOrBuildIndex(kind: CatalogKind, items: CatalogItem[]) {
    const cached = await readCache<CatalogIndexEntry[]>(indexKeys[kind], { maxAgeMs: apiCacheTtlMs });
    if (cached?.length) return cached;
    const index = buildIndex(items);
    writeCache(indexKeys[kind], index);
    return index;
  }

  static async #warmCatalog(logger: Logger) {
    const [weapons, items, warframes, mods] = (await Promise.all([
      getOrFetch(weaponsUrl, () => fetchJson(weaponsUrl), { logger }),
      getOrFetch(itemsUrl, () => fetchJson(itemsUrl), { logger }),
      getOrFetch(warframesUrl, () => fetchJson(warframesUrl), { logger }),
      getOrFetch(modsUrl, () => fetchJson(modsUrl), { logger }),
    ])) as [CatalogItem[], CatalogItem[], CatalogItem[], CatalogItem[]];

    WorldStateClient.#warframeIndex = await WorldStateClient.#loadOrBuildIndex('warframes', warframes);
    WorldStateClient.#modIndex = await WorldStateClient.#loadOrBuildIndex('mods', mods);
    WorldStateClient.#weaponIndex = await WorldStateClient.#loadOrBuildIndex(
      'weapons',
      mergeWeaponCatalog(weapons, items)
    );
  }

  static #ensureFullCatalog(kind: CatalogKind) {
    if (WorldStateClient.#fullCatalogCache.has(kind)) return;
    if (kind === 'warframes') {
      WorldStateClient.#fullCatalogCache.set(kind, readStaleCacheSync<CatalogItem[]>(warframesUrl) ?? []);
      return;
    }
    if (kind === 'mods') {
      WorldStateClient.#fullCatalogCache.set(kind, readStaleCacheSync<CatalogItem[]>(modsUrl) ?? []);
      return;
    }
    const weapons = readStaleCacheSync<CatalogItem[]>(weaponsUrl) ?? [];
    const items = readStaleCacheSync<CatalogItem[]>(itemsUrl) ?? [];
    WorldStateClient.#fullCatalogCache.set(kind, mergeWeaponCatalog(weapons, items));
  }

  static #fullCatalog(kind: CatalogKind) {
    WorldStateClient.#ensureFullCatalog(kind);
    return WorldStateClient.#fullCatalogCache.get(kind) ?? [];
  }

  static ENDPOINTS = {
    WORLDSTATE: {
      TIMESTAMP: 'timestamp',
      NEWS: 'news',
      EVENTS: 'events',
      ALERTS: 'alerts',
      ARCHON_HUNT: 'archonHunt',
      SORTIE: 'sortie',
      SYNDICATE_MISSIONS: 'syndicateMissions',
      FISSURES: 'fissures',
      GLOBAL_UPGRADES: 'globalUpgrades',
      FLASH_SALES: 'flashSales',
      INVASIONS: 'invasions',
      DARK_SECTORS: 'darkSectors',
      VOID_TRADER: 'voidTrader',
      DAILY_DEALS: 'dailyDeals',
      SIMARIS: 'simaris',
      CONCLAVE_CHALLENGES: 'conclaveChallenges',
      PERSISTENT_ENEMIES: 'persistentEnemies',
      EARTH_CYCLE: 'earthCycle',
      CETUS_CYCLE: 'cetusCycle',
      CAMBION_CYCLE: 'cambionCycle',
      WEEKLY_CHALLENGES: 'weeklyChallenges',
      CONSTRUCTION_PROGRESS: 'constructionProgress',
      VALLIS_CYCLE: 'vallisCycle',
      DUVIRI_CYCLE: 'duviriCycle',
      NIGHTWAVE: 'nightwave',
      KUVA: 'kuva',
      ARBITRATION: 'arbitration',
      SENTIENT_OUTPOSTS: 'sentientOutposts',
      STEEL_PATH: 'steelPath',
    },
    SEARCH: {
      ARCANES: 'arcanes',
      CONCLAVE: 'conclave',
      DROPS: 'drops',
      EVENTS: 'events',
      FACTIONS: 'factions',
      FISSURE_MODIFIERES: 'fissureModifiers',
      ITEMS: 'items',
      LANGUAGES: 'languages',
      MISSION_TYPES: 'missionTypes',
      OPERATION_TYPES: 'operationTypes',
      PERSISTENT_ENEMY: 'persistentEnemy',
      RIVENS: 'rivens',
      SOL_NODES: 'solNodes',
      SORTIE: 'sortie',
      SYNDICATES: 'syndicates',
      TUTORIALS: 'tutorials',
      UPGRADE_TYPES: 'upgradeTypes',
      WARFRAMES: 'warframes',
      WEAPONS: 'weapons',
    },
  } as const;

  async get(endpoint: string, platform = 'pc', language = 'en'): Promise<any> {
    try {
      this.#logger.silly(`fetching ${endpoint} for ${platform} with lang(${language})`);
      if (!Object.values(WorldStateClient.ENDPOINTS.WORLDSTATE).includes(endpoint as never)) {
        this.#logger.error(`invalid request: ${endpoint} not an ENDPOINTS.WORLDSTATE`);
        return undefined;
      }
      return fetch(`${apiBase}/${platform.toLowerCase()}/${endpoint}/?language=${language}&ts=${Date.now()}`, {
        headers: {
          platform,
          'Accept-Language': language,
        },
      }).then((d) => d.json());
    } catch (e) {
      this.#logger.warn(`Error fetching worldstate data: ${e}`);
      return undefined;
    }
  }

  async g(endpoint: string, platform = 'pc', language = 'en'): Promise<unknown> {
    this.#logger.silly(`fetching ${endpoint}`);
    const validEndpoints = [
      ...Object.values(WorldStateClient.ENDPOINTS.WORLDSTATE),
      ...Object.values(WorldStateClient.ENDPOINTS.SEARCH),
    ] as string[];
    if (!validEndpoints.includes(endpoint)) {
      this.#logger.error(`invalid request: ${endpoint} not an ENDPOINTS.WORLDSTATE or ENDPOINTS.SEARCH`);
      return undefined;
    }
    return fetch(`${apiBase}/${endpoint}/?language=${language}&ts=${Date.now()}`, {
      headers: {
        platform,
        'Accept-Language': language,
      },
    }).then((d) => d.json());
  }

  async riven(query: string, platform: string) {
    this.#logger.silly(`searching rivens for ${query}`);
    return fetch(`${apiBase}/${platform}/rivens/search/${encodeURIComponent(query)}/`).then((d) => d.json());
  }

  async search(endpoint: string, query: string, language = 'en') {
    this.#logger.silly(`searching ${endpoint} for ${query}`);
    return fetch(`${apiBase}/${endpoint}/search/${encodeURIComponent(query.toLowerCase())}/?language=${language}`).then(
      (d) => d.json()
    );
  }

  async pricecheck(
    query: string,
    {
      type = 'attachment',
      platform = 'pc',
      language = 'en',
      rank,
      ranks,
    }: {
      type?: string;
      platform?: string;
      language?: string;
      rank?: number;
      ranks?: string;
    } = {}
  ) {
    this.#logger.silly(`pricechecking ${query}`);
    const params = new URLSearchParams({ language: language || 'en' });
    if (rank !== undefined) params.set('rank', String(rank));
    if (ranks?.trim()) params.set('ranks', ranks.trim());

    const url = `${apiBase}/pricecheck/${type || 'attachment'}/${encodeURIComponent(query)}/?${params}`;
    this.#logger.silly(`pricechecking... ${url}`);
    return fetch(url, {
      headers: {
        platform: platform || 'pc',
        'Accept-Language': language,
      },
    }).then((d) => d.json());
  }

  async relic(tier: string, name: string) {
    const tierLabel = toTitleCase(tier);
    const relicName = tierLabel.toLowerCase() === 'requiem' ? name.toUpperCase().trim() : toTitleCase(name.trim());
    const url = `${relicBase}/${tierLabel}/${relicName}.json`;

    try {
      this.#logger.silly(`fetching ${url}`);
      const response = await fetch(url);
      const contentType = response.headers.get('content-type') ?? '';
      if (!response.ok || !contentType.includes('json')) {
        this.#logger.debug(`Relic not found (${response.status}): ${url}`);
        return undefined;
      }
      return await response.json();
    } catch (e) {
      this.#logger.debug(e);
      return undefined;
    }
  }

  weapon(query: string) {
    this.#logger.silly(`searching weapons for ${query}`);
    if (query?.length < 2) return [];
    const results = qEngine(`weapons[* uniqueName=${query} || name~/^(${query})/i]`, {
      data: { weapons: WorldStateClient.#fullCatalog('weapons') },
      allowRegexp: true,
    })?.value as CatalogItem[] | undefined;
    return Array.isArray(results)
      ? results.map((r) => {
          delete r.patchlogs;
          return r;
        })
      : undefined;
  }

  warframe(query: string) {
    this.#logger.silly(`searching warframes for ${query}`);
    if (query?.length < 2) return [];
    const results = qEngine(`warframes[* name~/^(${query})/i || uniqueName~/^(${query})/i]`, {
      data: { warframes: WorldStateClient.#fullCatalog('warframes') },
      allowRegexp: true,
    })?.value as CatalogItem[] | undefined;
    return Array.isArray(results)
      ? results.map((r) => {
          delete r.patchlogs;
          return r;
        })
      : undefined;
  }

  mod(query: string) {
    this.#logger.silly(`searching mods for ${query}`);
    if (query?.length < 2) return [];
    const results = qEngine(`mods[* name~/^(${query})/i || uniqueName~/^(${query})/i]`, {
      data: { mods: WorldStateClient.#fullCatalog('mods') },
      allowRegexp: true,
    })?.value as CatalogItem[] | undefined;
    return Array.isArray(results)
      ? results.map((r) => {
          delete r.patchlogs;
          return r;
        })
      : undefined;
  }

  modsByType(types: string[]) {
    this.#logger.silly(`filtering mods in ${JSON.stringify(types)}`);
    return WorldStateClient.#modIndex?.filter((mod) => mod.type && types.includes(mod.type)) ?? [];
  }

  warframesByType(type: string) {
    this.#logger.silly(`filtering warframes in ${JSON.stringify(type)}`);
    return WorldStateClient.#warframeIndex?.filter((frame) => frame.type === type) ?? [];
  }

  weaponsByType(type: string) {
    this.#logger.silly(`filtering weapons in ${JSON.stringify(type)}`);
    return WorldStateClient.#weaponIndex?.filter((weapon) => weapon.type === type) ?? [];
  }

  static catalogReady() {
    return Boolean(
      WorldStateClient.#warframeIndex?.length &&
      WorldStateClient.#weaponIndex?.length &&
      WorldStateClient.#modIndex?.length
    );
  }

  static #filterCatalog<T extends { name?: string; uniqueName?: string }>(items: T[], filter = '') {
    const query = filter.trim().toLowerCase();
    if (!query) return items;
    return items.filter(
      (item) =>
        String(item.name ?? '')
          .toLowerCase()
          .includes(query) ||
        String(item.uniqueName ?? '')
          .toLowerCase()
          .includes(query)
    );
  }

  resolveWarframe(value: string) {
    if (!value) return undefined;
    const indexed = WorldStateClient.#warframeIndex?.find((item) => item.uniqueName === value);
    if (indexed && !WorldStateClient.#fullCatalogCache.has('warframes')) {
      return indexed;
    }
    const exact = WorldStateClient.#fullCatalog('warframes').find((item) => item.uniqueName === value);
    if (exact) return exact;
    return this.warframe(value)?.[0];
  }

  resolveWeapon(value: string) {
    if (!value) return undefined;
    const indexed = WorldStateClient.#weaponIndex?.find((item) => item.uniqueName === value);
    if (indexed && !WorldStateClient.#fullCatalogCache.has('weapons')) {
      return indexed;
    }
    const exact = WorldStateClient.#fullCatalog('weapons').find((item) => item.uniqueName === value);
    if (exact) return exact;
    return this.weapon(value)?.[0];
  }

  resolveMod(value: string) {
    if (!value) return undefined;
    const indexed = WorldStateClient.#modIndex?.find((item) => item.uniqueName === value);
    if (indexed && !WorldStateClient.#fullCatalogCache.has('mods')) {
      return indexed;
    }
    const exact = WorldStateClient.#fullCatalog('mods').find((item) => item.uniqueName === value);
    if (exact) return exact;
    return this.mod(value)?.[0];
  }

  listWarframes(filter = '') {
    return WorldStateClient.#filterCatalog(WorldStateClient.#warframeIndex ?? [], filter);
  }

  listWeapons(filter = '') {
    return WorldStateClient.#filterCatalog(WorldStateClient.#weaponIndex ?? [], filter);
  }

  listMods(filter = '', types?: string[]) {
    const pool = types?.length
      ? (WorldStateClient.#modIndex?.filter((mod) => mod.type && types.includes(mod.type)) ?? [])
      : (WorldStateClient.#modIndex ?? []);
    return WorldStateClient.#filterCatalog(pool, filter);
  }
}
