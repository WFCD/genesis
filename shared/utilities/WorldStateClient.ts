import qEngine from 'json-query';
import fetch from 'node-fetch';

import { getOrFetch } from '#shared/utilities/ApiDiskCache';
import { apiBase } from '#shared/utilities/CommonFunctions';
import type { Logger } from '#shared/types/logger';

const relicBase = 'https://drops.warframestat.us/data/relics';
const catalogLanguage = 'en';

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

/** Data interaction layer for requesting data from the WorldState API */
export default class WorldStateClient {
  #logger: Logger;

  static #weapons: CatalogItem[] | undefined;

  static #warframes: CatalogItem[] | undefined;

  static #mods: CatalogItem[] | undefined;

  static #initPromise: Promise<void> | undefined;

  constructor(logger: Logger = console as unknown as Logger) {
    this.#logger = logger;
    WorldStateClient.#ensureLoaded(logger);
  }

  static whenReady() {
    return WorldStateClient.#initPromise ?? Promise.resolve();
  }

  static #ensureLoaded(logger: Logger) {
    if (WorldStateClient.#weapons) return;
    if (!WorldStateClient.#initPromise) {
      WorldStateClient.#initPromise = WorldStateClient.#loadCatalog(logger).catch((err) => {
        WorldStateClient.#initPromise = undefined;
        throw err;
      });
    }
  }

  static async #loadCatalog(logger: Logger) {
    const weaponsUrl = `${apiBase}/weapons/?language=${catalogLanguage}`;
    const itemsUrl = `${apiBase}/items/?language=${catalogLanguage}`;
    const warframesUrl = `${apiBase}/warframes/?language=${catalogLanguage}`;
    const modsUrl = `${apiBase}/mods/?language=${catalogLanguage}`;

    const [weapons, items, warframes, mods] = (await Promise.all([
      getOrFetch(weaponsUrl, () => fetchJson(weaponsUrl), { logger }),
      getOrFetch(itemsUrl, () => fetchJson(itemsUrl), { logger }),
      getOrFetch(warframesUrl, () => fetchJson(warframesUrl), { logger }),
      getOrFetch(modsUrl, () => fetchJson(modsUrl), { logger }),
    ])) as [CatalogItem[], CatalogItem[], CatalogItem[], CatalogItem[]];

    WorldStateClient.#weapons = [...weapons, ...items.filter((i) => i?.uniqueName?.includes('OperatorAmplifiers'))];
    WorldStateClient.#warframes = warframes;
    WorldStateClient.#mods = mods;
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
    }: { type?: string; platform?: string; language?: string } = {}
  ) {
    this.#logger.silly(`pricechecking ${query}`);
    const url = `${apiBase}/pricecheck/${type || 'attachment'}/${query}/?language=${language || 'en'}&platform=${
      platform || 'pc'
    }`;
    this.#logger.silly(`pricechecking... ${url}`);
    return fetch(url, {
      headers: {
        platform,
        'Accept-Language': language,
      },
    }).then((d) => d.json());
  }

  async relic(tier: string, name: string) {
    try {
      this.#logger.silly(`fetching ${tier} ${name}`);
      return fetch(
        `${relicBase}/${toTitleCase(tier)}/${
          tier.toLowerCase() === 'requiem' ? name.toUpperCase() : toTitleCase(name)
        }.json`
      ).then((d) => d.json());
    } catch (e) {
      this.#logger.debug(e);
    }
  }

  weapon(query: string) {
    this.#logger.silly(`searching weapons for ${query}`);
    if (query?.length < 2) return [];
    const results = qEngine(`weapons[* uniqueName=${query} || name~/^(${query})/i]`, {
      data: { weapons: WorldStateClient.#weapons },
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
      data: { warframes: WorldStateClient.#warframes },
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
      data: { mods: WorldStateClient.#mods },
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
    return WorldStateClient.#mods?.filter((m) => types.includes(String(m.type))) ?? [];
  }

  warframesByType(type: string) {
    this.#logger.silly(`filtering warframes in ${JSON.stringify(type)}`);
    return WorldStateClient.#warframes?.filter((m) => m.type === type) ?? [];
  }

  weaponsByType(type: string) {
    this.#logger.silly(`filtering weapons in ${JSON.stringify(type)}`);
    return WorldStateClient.#weapons?.filter((m) => m.type === type) ?? [];
  }
}
