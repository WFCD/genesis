import flatCache from 'flat-cache';
import cron from 'cron';
import path, { dirname } from 'node:path';
import { fileURLToPath } from 'url';
import Notifier from './worldstate/Notifier.js';
import CycleNotifier from './worldstate/CycleNotifier.js';
import FeedsNotifier from './FeedsNotifier.js';
import TwitchNotifier from './twitch/TwitchNotifier.js';
import WorldStateCache from '../utilities/WorldStateCache.js';
import Rest from '../utilities/RESTWrapper.js';
import Database from '../settings/Database.js';
import { cachedEvents } from '../resources/index.js';
import logger from '../utilities/Logger.js';
import { games } from '../utilities/CommonFunctions.js';

const Job = cron.CronJob;
const deps = {};
const activePlatforms = (process.env.PLATFORMS || 'pc').split(',');
const rest = new Rest();
const forceHydrate = (process.argv[2] || '').includes('--hydrate');

const ldirname = dirname(fileURLToPath(import.meta.url));

let timeout;

class Worker {
  static #activeHydrations = [];

  constructor() {
    logger.info(`forceHydrate: ${forceHydrate}`);
    /**
     * Objects holding worldState data, one for each platform
     * @type {Object.<WorldStateCache>}
     */
    this.worldStates = {};

    timeout = process.env.WORLDSTATE_TIMEOUT || 60000;

    if (games.includes('WARFRAME')) {
      activePlatforms.forEach((platform) => {
        this.worldStates[platform] = new WorldStateCache(platform, timeout);
      });
    }
    return (async () => {
      deps.settings = await new Database();
      return this;
    })();
  }
  async hydratePings() {
    if (this.#activeHydrations.includes('pings')) {
      logger.debug('Skipping pings hydration... already running');
      return;
    }
    this.#activeHydrations.push('pings');
    const sDate = Date.now();
    const pings = await deps.settings.getAllPings();
    if (pings) {
      deps.workerCache.setKey('pings', pings);
      deps.workerCache.save(true);
    }
    const eDate = Date.now();
    logger.info(`ping hydration took ${String(eDate - sDate).red}ms`, 'DB');
    this.#activeHydrations.splice(this.#activeHydrations.indexOf('pings'));
  }
  async hydrateGuilds() {
    if (this.#activeHydrations.includes('guilds')) {
      logger.debug('Skipping guilds hydration... already running');
    } else {
      this.#activeHydrations.push('guilds');
      const sDate = Date.now();
      const guilds = await deps.settings.getGuilds();
      if (guilds) {
        deps.workerCache.setKey('guilds', guilds);
        deps.workerCache.save(true);
      }
      const eDate = Date.now();
      logger.info(`guild hydration took ${String(eDate - sDate).red}ms`, 'DB');
      this.#activeHydrations.splice(this.#activeHydrations.indexOf('guilds'));
    }
    await this.hydratePings();
  }
  async hydrateQueries() {
    if (this.#activeHydrations.includes('events')) {
      logger.debug('Skipping events hydration... already running');
      return;
    }
    this.#activeHydrations.push('events');
    const sDate = Date.now();
    const promises = [];
    cachedEvents.forEach((cachedEvent) => {
      activePlatforms.forEach((platform) => {
        promises.push(
          (async () => {
            const notifications = await deps.settings.getAgnosticNotifications(cachedEvent, platform);
            deps.workerCache.setKey(`${cachedEvent}:${platform}`, notifications);
          })()
        );
      });
    });
    await Promise.all(promises);
    deps.workerCache.save(true);
    const eDate = Date.now();
    logger.info(`query hydration took ${String(eDate - sDate).red}ms`, 'DB');
    this.#activeHydrations.splice(this.#activeHydrations.indexOf('events'));
  }
  async initCache() {
    if (games.includes('WARFRAME')) {
      deps.workerCache = flatCache.load('worker', path.resolve(ldirname, '../../.cache'));

      // generate guild cache data if not present
      const currentGuilds = deps.workerCache.getKey('guilds');
      if (!currentGuilds || forceHydrate) await this.hydrateGuilds();

      const currentPings = deps.workerCache.getKey('pings');
      if (!(currentPings && Object.keys(currentPings).length) || forceHydrate) await this.hydratePings();

      let hydrateEvents = forceHydrate;
      await Promise.all(
        cachedEvents.map(async (cachedEvent) =>
          Promise.all(
            activePlatforms.map(async (platform) => {
              if (!deps.workerCache.getKey(`${cachedEvent}:${platform}`)) {
                hydrateEvents = true;
              }
            })
          )
        )
      );
      if (hydrateEvents) await this.hydrateQueries();

      // refresh guild cache every hour... it's a heavy process, we don't want to do it much
      deps.guildHydration = new Job('0 0 * * * *', this.hydrateGuilds.bind(this), undefined, true);
      deps.queryHydration = new Job('0 */10 * * * *', this.hydrateQueries.bind(this), undefined, true);
    }
  }

  /**
   * Start the worker notifier systems
   * @returns {Promise} [description]
   */
  async start() {
    try {
      deps.client = rest;
      deps.worldStates = this.worldStates;
      deps.timeout = timeout;
      deps.activePlatforms = activePlatforms;

      await rest.init();
      await deps.settings.init();
      await this.initCache();

      if (games.includes('WARFRAME')) {
        this.notifier = new Notifier(deps);
        this.cycleNotifier = new CycleNotifier(deps);
      }

      if (games.includes('RSS')) {
        this.feedNotifier = new FeedsNotifier(deps);
        this.feedNotifier.start();
      }

      if (games.includes('TWITCH')) {
        this.twitchNotifier = new TwitchNotifier(deps);
        this.twitchNotifier.start();
      }

      await this.notifier.start();
      await this.cycleNotifier.start();

      if (logger.isLoggable('DEBUG')) {
        rest.controlMessage({
          embeds: [
            {
              description: `Worker ready on ${activePlatforms}`,
              color: 0x2b90ec,
            },
          ],
        });
      }
    } catch (e) {
      logger.error(e);
    }
  }
}

(async () => {
  const worker = await new Worker();
  await worker.start();
})();
