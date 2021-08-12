'use strict';

const fetch = require('./Fetcher');
const { apiBase } = require('../CommonFunctions');

const relicBase = 'https://drops.warframestat.us/data/relics';

function toTitleCase(str) {
  return str.replace(/\w\S*/g, txt => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
}

/**
 * WorldState interaction client
 * @type {Object}
 */
module.exports = class WorldStateClient {
  /**
   * Create a worldstate client
   * @param {Logger} logger logger for debugging requests
   */
  constructor(logger = console) {
    this.logger = logger;
  }

  /**
   * Enum for WorldState endpoints
   * @readonly
   * @enum {string}
   */
  static ENDPOINTS = {
    WORLDSTATE: {
      TIMESTAMP: 'timestamp',
      NEWS: 'news',
      EVENTS: 'events',
      ALERTS: 'alerts',
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
  };

  /**
   * Get platform-specific worldstate data
   * @param {WorldStateClient.ENDPOINTS.WORLDSTATE} endpoint worldstate endpoint to fetch
   * @param {string} platform platform to fetch from
   * @param {string} language language to fetch
   * @returns {Promise<Object>|undefined}
   */
  async get(endpoint, platform = 'pc', language = 'en') {
    this.logger.silly(`fetching ${endpoint} for ${platform} with lang(${language})`);
    if (!Object.values(WorldStateClient.ENDPOINTS.WORLDSTATE).includes(endpoint)) {
      this.logger.error(`invalid request: ${endpoint} not an ENDPOINTS.WORLDSTATE`);
      return undefined;
    }
    return fetch(`${apiBase}/${platform.toLowerCase()}/${endpoint}`, {
      headers: {
        platform,
        'Accept-Language': language,
      },
    });
  }

  async g(endpoint, platform = 'pc', language = 'en') {
    this.logger.silly(`fetching ${endpoint}`);
    if (!Object.values(WorldStateClient.ENDPOINTS.WORLDSTATE).includes(endpoint)) {
      this.logger.error(`invalid request: ${endpoint} not an ENDPOINTS.WORLDSTATE`);
      return undefined;
    }
    return fetch(`${apiBase}/${endpoint}`, {
      headers: {
        platform,
        'Accept-Language': language,
      },
    });
  }

  /**
   * Query the provided platform for stats for a specific weapon riven
   * @param {string} query weapon search string
   * @param {string} platform platform to search against
   * @returns {Promise<Array<Object>>}
   */
  async riven(query, platform) {
    this.logger.silly(`searching rivens for ${query}`);
    return fetch(`${apiBase}/${platform}/rivens/search/${encodeURIComponent(query)}`);
  }

  /**
   * Search an endpoint for the given query
   * @param {ENDPOINTS.SEARCH} endpoint endpoint to search
   * @param {string} query search query
   * @returns {Promise<Object>}
   */
  async search(endpoint, query) {
    this.logger.silly(`searching ${endpoint} for ${query}`);
    return fetch(`${apiBase}/${endpoint}/search/${encodeURIComponent(query.toLowerCase())}`);
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
    this.logger.silly(`pricechecking ${query}`);
    const url = `${apiBase}/pricecheck/${type || 'attachment'}/${query}?language=${language || 'en'}&platform=${platform || 'pc'}`;
    this.logger.info(`fetching ${url}`);
    return fetch(url, {
      headers: {
        platform,
        'Accept-Language': language,
      },
    });
  }

  /**
   * Retrieve data for a particular relic for drops, etc.
   * @param {string} tier Relic era (Lith, Neo, etc.)
   * @param {string} name Relic name (A1, etc.)
   * @returns {Promise<Object>}
   */
  async relic(tier, name) {
    this.logger.silly(`fetching ${tier} ${name}`);
    return fetch(`${relicBase}/${toTitleCase(tier)}/${toTitleCase(name)}.json`);
  }
};
