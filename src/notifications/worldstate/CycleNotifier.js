import Broadcaster from '../Broadcaster.js';
import logger from '../../utilities/Logger.js';
import { platforms } from '../../utilities/CommonFunctions.js';

import { between, embeds, fromNow, perLanguage, updating } from '../NotifierUtils.js';

const beats = {};
let refreshRate = (process.env.WORLDSTATE_TIMEOUT || 30000) / 3;

/**
 * @typedef {Object} CycleData
 * @property {Object} data cycle information corresponding to the same-named platform
 * @property {boolean} dirty
 */

function buildNotifiableData(newData, platform) {
  const data = {
    /* Cycles data */
    /** @type {CycleData} */
    cetus: {
      data: newData.cetusCycle,
      dirty: between(newData.cetusCycle.activation, platform, refreshRate, beats),
    },
    /** @type {CycleData} */
    cambion: {
      data: newData.cambionCycle,
      dirty: between(newData.cambionCycle.activation, platform, refreshRate, beats),
    },
    /** @type {CycleData} */
    earth: {
      data: newData.earthCycle,
      dirty: between(newData.earthCycle.activation, platform, refreshRate, beats),
    },
    /** @type {CycleData} */
    vallis: {
      data: newData.vallisCycle,
      dirty: between(newData.vallisCycle.activation, platform, refreshRate, beats),
    },
  };

  const ostron = newData.syndicateMissions.filter((mission) => mission.syndicate === 'Ostrons')[0];
  if (ostron) {
    data.cetus.data.bountyExpiry = ostron.expiry;
  }

  return data;
}

export default class CyclesNotifier {
  #settings;
  #worldStates;
  #broadcaster;
  #updating;

  constructor({ settings, client, worldStates, timeout, workerCache }) {
    this.#settings = settings;
    this.#worldStates = worldStates;
    this.#broadcaster = new Broadcaster({
      client,
      settings: this.#settings,
      workerCache,
    });
    logger.info('Ready', 'CY');

    platforms.forEach((p) => {
      beats[p] = {
        lastUpdate: Date.now(),
        currCycleStart: undefined,
      };
    });
    refreshRate = timeout;
  }

  /** Start the notifier */
  async start() {
    Object.entries(this.#worldStates).forEach(([, ws]) => {
      ws.on('newData', async (platform, newData) => {
        await this.onNewData(platform, newData);
      });
    });
  }

  /**
   * Send notifications on new data from worldstate
   * @param  {string} platform Platform to be updated
   * @param  {Object} newData  Updated data from the worldstate
   */
  async onNewData(platform, newData) {
    // don't wait for the previous to finish, this creates a giant backup,
    //  adding 4 new entries every few seconds
    if (updating.has(`${platform}:cycles`)) return;

    beats[platform].currCycleStart = Date.now();
    if (!newData?.timestamp) return;

    const notifiedIds = await this.#settings.getNotifiedIds(`${platform}:cycles`);

    // Set up data to notify
    try {
      updating.add(`${platform}:cycles`);
      await this.sendNew(platform, newData, notifiedIds, buildNotifiableData(newData, platform));
      updating.remove(`${platform}:cycles`);
    } catch (e) {
      if (e.message === 'already updating') {
        return; // expected to happen
      }
      throw e;
    }
  }

  async sendNew(platform, rawData, notifiedIds, { cetus, earth, cambion, vallis }) {
    // Send all notifications
    const cycleIds = [];
    try {
      logger.silly(`sending new cycle data on ${platform}...`);
      cycleIds.push(await this.sendCetusCycle(cetus, platform, notifiedIds));
      cycleIds.push(await this.sendEarthCycle(earth, platform, notifiedIds));
      cycleIds.push(await this.sendVallisCycle(vallis, platform, notifiedIds));
      cycleIds.push(await this.sendCambionCycle(cambion, platform, notifiedIds));
    } catch (e) {
      logger.error(e);
    } finally {
      beats[platform].lastUpdate = Date.now();
    }

    const alreadyNotified = [...cycleIds].filter((a) => a);

    await this.#settings.setNotifiedIds(`${platform}:cycles`, alreadyNotified);
    logger.silly(`completed sending notifications for ${platform}`);
  }

  async sendCambionCycle({ data: newCycle, dirty: cycleChange }, platform, notifiedIds) {
    const minutesRemaining = cycleChange ? '' : `.${Math.round(fromNow(newCycle.expiry) / 60000)}`;
    const type = `cambion.${newCycle.active}${minutesRemaining}`;
    if (type.endsWith('.0')) return type; // skip sending 0's so the next cycle starts faster;
    if (!notifiedIds.includes(type)) {
      await perLanguage(async ({ i18n, locale }) =>
        this.#broadcaster.broadcast(new embeds.Cambion(newCycle, { i18n, locale }), platform, type)
      );
    }
    return type;
  }

  async sendCetusCycle({ data: newCycle, dirty: cycleChange }, platform, notifiedIds) {
    const minutesRemaining = cycleChange ? '' : `.${Math.round(fromNow(newCycle.expiry) / 60000)}`;
    const type = `cetus.${newCycle.isDay ? 'day' : 'night'}${minutesRemaining}`;
    if (type.endsWith('.0')) return type; // skip sending 0's so the next cycle starts faster;

    if (!notifiedIds.includes(type)) {
      await perLanguage(async ({ i18n, locale }) =>
        this.#broadcaster.broadcast(new embeds.Cycle(newCycle, { i18n, locale, platform }), platform, type)
      );
    }
    return type;
  }

  async sendEarthCycle({ data: newCycle, dirty: cycleChange }, platform, notifiedIds) {
    const smolRange = fromNow(newCycle.expiry) < refreshRate;
    if (smolRange && !cycleChange) {
      cycleChange = true;
      newCycle.isDay = !newCycle.isDay;
    }
    const minutesRemaining = cycleChange ? '' : `.${Math.round(fromNow(newCycle.expiry) / 60000)}`;
    const type = `earth.${newCycle.isDay ? 'day' : 'night'}${minutesRemaining}`;
    if (type.endsWith('.0')) return type; // skip sending 0's so the next cycle starts faster;
    if (!notifiedIds.includes(type)) {
      await perLanguage(async ({ i18n, locale }) =>
        this.#broadcaster.broadcast(new embeds.Cycle(newCycle, { i18n, locale, platform }), platform, type)
      );
    }
    return type;
  }

  async sendVallisCycle({ data: newCycle, dirty: cycleChange }, platform, notifiedIds) {
    const minutesRemaining = cycleChange ? '' : `.${Math.round(fromNow(newCycle.expiry) / 60000)}`;
    const type = `solaris.${newCycle.isWarm ? 'warm' : 'cold'}${minutesRemaining}`;
    if (type.endsWith('.0')) return type; // skip sending 0's so the next cycle starts faster;
    if (!notifiedIds.includes(type)) {
      await perLanguage(async ({ i18n, locale }) =>
        this.#broadcaster.broadcast(new embeds.Solaris(newCycle, { i18n, locale, platform }), platform, type)
      );
    }
    return type;
  }
}
