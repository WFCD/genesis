import Broadcaster from '../Broadcaster.js';
import logger from '../../utilities/Logger.js';
import { platforms } from '../../utilities/CommonFunctions.js';

import {
  between, embeds, fromNow, perLanguage,
} from '../NotifierUtils.js';

const beats = {};
let refreshRate = (process.env.WORLDSTATE_TIMEOUT || 60000) / 3;

function buildNotifiableData(newData, platform) {
  const data = {
    /* Cycles data */
    cetusCycleChange: between(newData.cetusCycle.activation, platform, refreshRate, beats),
    earthCycleChange: between(newData.earthCycle.activation, platform, refreshRate, beats),
    vallisCycleChange: between(newData.vallisCycle.activation, platform, refreshRate, beats),
    cambionCycleChange: between(newData.cambionCycle.activation, platform, refreshRate, beats),
    cambionCycle: newData.cambionCycle,
    cetusCycle: newData.cetusCycle,
    earthCycle: newData.earthCycle,
    vallisCycle: newData.vallisCycle,
  };

  const ostron = newData.syndicateMissions.filter(mission => mission.syndicate === 'Ostrons')[0];
  if (ostron) {
    data.cetusCycle.bountyExpiry = ostron.expiry;
  }

  return data;
}

export default class CyclesNotifier {
  constructor({
    settings, client, worldStates, timeout, workerCache,
  }) {
    this.settings = settings;
    this.client = client;
    this.worldStates = worldStates;
    this.broadcaster = new Broadcaster({
      client,
      settings: this.settings,
      workerCache,
    });
    logger.info('Ready', 'CY');

    platforms.forEach((p) => {
      beats[p] = {
        lastUpdate: Date.now(),
        currCycleStart: undefined,
      };
    });

    this.updating = false;
    refreshRate = timeout;
    this.updating = [];
  }

  /** Start the notifier */
  async start() {
    Object.entries(this.worldStates).forEach(([, ws]) => {
      ws.on('newData', async (platform, newData) => {
        await this.onNewData(platform, newData);
      });
    });
  }

  /**
   * Send notifications on new data from worldstate
   * @param  {string} platform Platform to be updated
   * @param  {json} newData  Updated data from the worldstate
   */
  async onNewData(platform, newData) {
    // don't wait for the previous to finish, this creates a giant backup,
    //  adding 4 new entries every few seconds
    if (this.updating.includes(platform)) return;

    beats[platform].currCycleStart = Date.now();
    if (!(newData && newData.timestamp)) return;

    const notifiedIds = await this.settings.getNotifiedIds(`${platform}:cycles`);

    // Set up data to notify
    this.updating.push(platform);

    await this.sendNew(platform, newData, notifiedIds,
      buildNotifiableData(newData, platform));

    this.updating.splice(this.updating.indexOf(platform), 1);
  }

  async sendNew(platform, rawData, notifiedIds, {
    cetusCycle, earthCycle, cetusCycleChange, earthCycleChange, vallisCycleChange,
    cambionCycle, cambionCycleChange, vallisCycle,
  }) {
    // Send all notifications
    const cycleIds = [];
    try {
      logger.silly(`sending new data on ${platform}...`);
      cycleIds.push(
        await this.sendCetusCycle(cetusCycle, platform, cetusCycleChange, notifiedIds),
      );
      cycleIds.push(
        await this.sendEarthCycle(earthCycle, platform, earthCycleChange, notifiedIds),
      );
      cycleIds.push(
        await this.sendVallisCycle(vallisCycle, platform, vallisCycleChange, notifiedIds),
      );
      cycleIds.push(
        await this.sendCambionCycle(cambionCycle, platform, cambionCycleChange, notifiedIds),
      );
    } catch (e) {
      logger.error(e);
    } finally {
      beats[platform].lastUpdate = Date.now();
    }

    const alreadyNotified = [
      ...cycleIds,
    ].filter(a => a);

    await this.settings.setNotifiedIds(`${platform}:cycles`, alreadyNotified);
    logger.silly(`completed sending notifications for ${platform}`);
  }

  // TODO: rethink overrideCycleChanges
  async sendCambionCycle(newCycle, platform, cycleChange, notifiedIds) {
    const smolRange = fromNow(newCycle.expiry) < refreshRate;
    if (smolRange && !cycleChange) {
      cycleChange = true;
      newCycle.active = newCycle.active === 'fass' ? 'vome' : 'fass';
    }
    const minutesRemaining = cycleChange ? '' : `.${Math.round(fromNow(newCycle.expiry) / 60000)}`;
    const type = `cambion.${newCycle.active}${minutesRemaining}`;
    if (!notifiedIds.includes(type)) {
      await perLanguage(async ({ i18n, locale }) => this.broadcaster.broadcast(
        new embeds.Cambion(newCycle, { i18n, locale }), platform, type,
      ));
    }
    return type;
  }

  async sendCetusCycle(newCycle, platform, cycleChange, notifiedIds) {
    const smolRange = fromNow(newCycle.expiry) < refreshRate;
    if (smolRange && !cycleChange) {
      cycleChange = true;
      newCycle.isDay = !newCycle.isDay;
    }
    const minutesRemaining = cycleChange ? '' : `.${Math.round(fromNow(newCycle.expiry) / 60000)}`;
    const type = `cetus.${newCycle.isDay ? 'day' : 'night'}${minutesRemaining}`;

    if (!notifiedIds.includes(type)) {
      await perLanguage(async ({ i18n, locale }) => this.broadcaster.broadcast(
        new embeds.Cycle(newCycle, { i18n, locale, platform }), platform, type,
      ));
    }
    return type;
  }

  async sendEarthCycle(newCycle, platform, cycleChange, notifiedIds) {
    const smolRange = fromNow(newCycle.expiry) < refreshRate;
    if (smolRange && !cycleChange) {
      cycleChange = true;
      newCycle.isDay = !newCycle.isDay;
    }
    const minutesRemaining = cycleChange ? '' : `.${Math.round(fromNow(newCycle.expiry) / 60000)}`;
    const type = `earth.${newCycle.isDay ? 'day' : 'night'}${minutesRemaining}`;
    if (!notifiedIds.includes(type)) {
      await perLanguage(async ({ i18n, locale }) => this.broadcaster.broadcast(
        new embeds.Cycle(newCycle, { i18n, locale, platform }), platform, type,
      ));
    }
    return type;
  }

  async sendVallisCycle(newCycle, platform, cycleChange, notifiedIds) {
    const smolRange = fromNow(newCycle.expiry) < refreshRate;
    if (smolRange && !cycleChange) {
      cycleChange = true;
      newCycle.isWarm = !newCycle.isWarm;
    }
    const minutesRemaining = cycleChange ? '' : `.${Math.round(fromNow(newCycle.expiry) / 60000)}`;
    const type = `solaris.${newCycle.isWarm ? 'warm' : 'cold'}${minutesRemaining}`;
    if (!notifiedIds.includes(type)) {
      await perLanguage(async ({ i18n, locale }) => this.broadcaster.broadcast(
        new embeds.Solaris(newCycle, { i18n, locale, platform }), platform, type,
      ));
    }
    return type;
  }
}
