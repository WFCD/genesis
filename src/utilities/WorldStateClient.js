import qEngine from 'json-query';
import fetch from 'node-fetch';

import { apiBase } from './CommonFunctions.js';

const relicBase = 'https://drops.warframestat.us/data/relics';
const toTitleCase = (str) =>
  str.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substring(1).toLowerCase());

/**
 * Data interaction layer for requesting data from the WorldState API
 * @class
 * @classdesc Interaction layer for WorldState API
 */
export default class WorldStateClient {
  /**
   * @type {Logger} logger for tracing
   */
  #logger;

  static #weapons;
  static #warframes;
  static #mods;

  /**
   * Create a worldstate client
   * @param {Logger|console} logger logger for debugging requests
   */
  constructor(logger = console) {
    this.#logger = logger;
    if (!WorldStateClient.#weapons) {
      (async function init() {
        if (!WorldStateClient.#weapons) {
          WorldStateClient.#weapons = await fetch(`${apiBase}/weapons/?language=en`).then((d) => d.json());
          const misc = (await fetch(`${apiBase}/items/?language=en`).then((d) => d.json())).filter((i) =>
            i?.uniqueName?.includes('OperatorAmplifiers')
          );
          WorldStateClient.#weapons.push(...misc);
        }
      })();
    }

    if (!WorldStateClient.#warframes) {
      (async function init() {
        if (!WorldStateClient.#warframes) {
          WorldStateClient.#warframes = await fetch(`${apiBase}/warframes/?language=en`).then((d) => d.json());
        }
      })();
    }

    if (!WorldStateClient.#mods) {
      (async function init() {
        if (!WorldStateClient.#mods) {
          WorldStateClient.#mods = await fetch(`${apiBase}/mods/?language=en`).then((d) => d.json());
        }
      })();
    }
  }

  /**
   * Enum for WorldState endpoints
   * @readonly
   */
  static ENDPOINTS = {
    /**
     * Enumerated worldstate endpoints
     * @enum {string}
     */
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
    /**
     * Enumerated search endpoints
     * @enum {string}
     */
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
  };

  /**
   * Get platform-specific worldstate data
   * @param {string<WorldStateClient.ENDPOINTS.WORLDSTATE>} endpoint worldstate endpoint to fetch
   * @param {string} platform platform to fetch from
   * @param {string} language language to fetch
   * @returns {Promise<Object>|undefined}
   */
  async get(endpoint, platform = 'pc', language = 'en') {
    try {
      this.#logger.silly(`fetching ${endpoint} for ${platform} with lang(${language})`);
      if (!Object.values(WorldStateClient.ENDPOINTS.WORLDSTATE).includes(endpoint)) {
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
      this.logger.warn(`Error fetching worldstate data: ${e}`);
      return undefined;
    }
  }

  async g(endpoint, platform = 'pc', language = 'en') {
    this.#logger.silly(`fetching ${endpoint}`);
    if (
      !Object.values(WorldStateClient.ENDPOINTS.WORLDSTATE)
        .concat(Object.values(WorldStateClient.ENDPOINTS.SEARCH))
        .includes(endpoint)
    ) {
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

  /**
   * Query the provided platform for stats for a specific weapon riven
   * @param {string} query weapon search string
   * @param {string} platform platform to search against
   * @returns {Promise<Array<Object>>}
   */
  async riven(query, platform) {
    this.#logger.silly(`searching rivens for ${query}`);
    return fetch(`${apiBase}/${platform}/rivens/search/${encodeURIComponent(query)}/`).then((d) => d.json());
  }

  /**
   * Search an endpoint for the given query
   * @param {string<WorldStateClient.ENDPOINTS.SEARCH>} endpoint endpoint to search
   * @param {string} query search query
   * @param {string} language language of content to fetch
   * @returns {Promise<Object>}
   */
  async search(endpoint, query, language = 'en') {
    this.#logger.silly(`searching ${endpoint} for ${query}`);
    return fetch(`${apiBase}/${endpoint}/search/${encodeURIComponent(query.toLowerCase())}/?language=${language}`).then(
      (d) => d.json()
    );
  }

  /**
   * Search an endpoint for the given query
   * @param {string} query search query
   * @param {string} type one of: 'attachment', 'string'...
   * @param {string} platform one of {@link platforms}
   * @param {string} language one of the supported languages
   *  (this is ignored on pricechecks, but you can provide it)
   * @returns {Promise<Object>}
   */
  async pricecheck(query, { type = 'attachment', platform = 'pc', language = 'en' }) {
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

  /**
   * Retrieve data for a particular relic for drops, etc.
   * @param {string} tier Relic era (Lith, Neo, etc.)
   * @param {string} name Relic name (A1, etc.)
   * @returns {Promise<Object>}
   */
  async relic(tier, name) {
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

  /**
   * Query for a weapon from cached weapon data
   * @param {string} query weapon name or unique id partial
   * @returns {Array<Object>}
   */
  weapon(query) {
    this.#logger.silly(`searching weapons for ${query}`);
    if (query?.length < 2) return [];
    const results = qEngine(`weapons[* uniqueName=${query} || name~/^(${query})/i]`, {
      data: { weapons: WorldStateClient.#weapons },
      allowRegexp: true,
    })?.value;
    return Array.isArray(results)
      ? results.map((r) => {
          delete r.patchlogs;
          return r;
        })
      : undefined;
  }

  /**
   * Query for a warframe from cached warframe data
   * @param {string} query warframes name or unique id partial
   * @returns {Array<Object>}
   */
  warframe(query) {
    this.#logger.silly(`searching warframes for ${query}`);
    if (query?.length < 2) return [];
    const results = qEngine(`warframes[* name~/^(${query})/i || uniqueName~/^(${query})/i]`, {
      data: { warframes: WorldStateClient.#warframes },
      allowRegexp: true,
    })?.value;
    return Array.isArray(results)
      ? results.map((r) => {
          delete r.patchlogs;
          return r;
        })
      : undefined;
  }

  /**
   * Query for a mods from cached warframe data
   * @param {string} query mods name or unique id partial
   * @returns {Array<Object>}
   */
  mod(query) {
    this.#logger.silly(`searching mods for ${query}`);
    if (query?.length < 2) return [];
    const results = qEngine(`mods[* name~/^(${query})/i || uniqueName~/^(${query})/i]`, {
      data: { mods: WorldStateClient.#mods },
      allowRegexp: true,
    })?.value;
    return Array.isArray(results)
      ? results.map((r) => {
          delete r.patchlogs;
          return r;
        })
      : undefined;
  }

  /**
   * Get mod types based on list of types
   * @param {Array<string>} types to filter on
   * @returns {Array<ItemResolvable>}
   */
  modsByType(types) {
    this.#logger.silly(`filtering mods in ${JSON.stringify(types)}`);
    return WorldStateClient.#mods.filter((m) => types.includes(m.type));
  }

  warframesByType(type) {
    this.#logger.silly(`filtering warframes in ${JSON.stringify(type)}`);
    return WorldStateClient.#warframes.filter((m) => m.type === type);
  }

  weaponsByType(type) {
    this.#logger.silly(`filtering weapons in ${JSON.stringify(type)}`);
    return WorldStateClient.#weapons.filter((m) => m.type === type);
  }
}
