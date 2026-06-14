// @ts-nocheck -- incremental TS migration; worker notification runtime
import logger from '#shared/utilities/Logger';
import { platforms } from '#shared/utilities/CommonFunctions';
import { locales } from '#shared/resources';

import { between, embeds, fromNow, i18ns, updating } from '../NotifierUtils';
import Broadcaster from '../Broadcaster';

const beats = {};
let refreshRate = process.env.WORLDSTATE_TIMEOUT || 30000;

const durations = {
  vallis: {
    cold: 1200000,
    warm: 400000,
  },
  earth: {
    day: 14400000,
    night: 14400000,
  },
  cetus: {
    day: 6000000,
    night: 3000000,
  },
  deimos: {
    fass: 6000000,
    vome: 3000000,
  },
  duviri: 7200000,
};

interface CycleData {
  data: object;
  dirty: boolean;
}

const MOOD_ORDER = ['joy', 'anger', 'envy', 'sorrow', 'fear'];

const nextMood = (state) => MOOD_ORDER[(MOOD_ORDER.indexOf(state) + 1) % MOOD_ORDER.length];

const isWithinRange = (minutesRemaining) => {
  switch (minutesRemaining) {
    case '.0':
    case '.1':
    case '.2':
      return true;
    default:
      return false;
  }
};

function buildNotifiableData(newData, platform, locale) {
  const key = `${platform}:${locale}`;
  const data: Record<string, CycleData> = {
    cetus: {
      data: newData.cetusCycle,
      dirty: between(newData.cetusCycle.activation, key, refreshRate, beats),
    },
    cambion: {
      data: newData.cambionCycle,
      dirty: between(newData.cambionCycle.activation, key, refreshRate, beats),
    },
    earth: {
      data: newData.earthCycle,
      dirty: between(newData.earthCycle.activation, key, refreshRate, beats),
    },
    vallis: {
      data: newData.vallisCycle,
      dirty: between(newData.vallisCycle.activation, key, refreshRate, beats),
    },
  };

  if (newData.duviriCycle) {
    data.duviri = {
      data: newData.duviriCycle,
      dirty: between(newData.duviriCycle.activation, key, refreshRate, beats),
    };
  }

  const ostron = newData.syndicateMissions.filter((mission) => mission.syndicate === 'Ostrons')[0];
  if (ostron) {
    data.cetus.data.bountyExpiry = ostron.expiry;
  }

  return data;
}

const resolveCambionCycleType = ({ data: newCycle, dirty: cycleChange }) => {
  let minutesRemaining = cycleChange ? '' : `.${Math.round(fromNow(newCycle.expiry) / 60000)}`;
  const clone = JSON.parse(JSON.stringify(newCycle));
  if (isWithinRange(minutesRemaining)) {
    clone.state = clone.state === 'vome' ? 'fass' : 'vome';
    const newEnd = new Date(clone.expiry).getTime() + durations.deimos[clone.state];
    clone.id = `cambionCycle${newEnd}`;
    clone.activation = clone.expiry;
    clone.expiry = new Date(newEnd);
    delete clone.timeLeft;
    delete clone.shortString;
    minutesRemaining = '';
  } else return undefined;
  return { type: `cambion.${clone.state}${minutesRemaining}`, clone };
};

const resolveCetusCycleType = ({ data: newCycle, dirty: cycleChange }) => {
  let minutesRemaining = cycleChange ? '' : `.${Math.round(fromNow(newCycle.expiry) / 60000)}`;
  const clone = JSON.parse(JSON.stringify(newCycle));
  if (isWithinRange(minutesRemaining)) {
    clone.isCetus = true;
    clone.isDay = !clone.isDay;
    clone.state = clone.state === 'day' ? 'night' : 'day';
    const newEnd = new Date(clone.expiry).getTime() + durations.cetus[clone.state];
    clone.id = `cetusCycle${newEnd}`;
    clone.activation = clone.expiry;
    clone.expiry = new Date(newEnd);
    delete clone.timeLeft;
    delete clone.shortString;
    minutesRemaining = '';
  } else return undefined;
  return { type: `cetus.${clone.state}${minutesRemaining}`, clone };
};

const resolveEarthCycleType = ({ data: newCycle, dirty: cycleChange }) => {
  let minutesRemaining = cycleChange ? '' : `.${Math.round(fromNow(newCycle.expiry) / 60000)}`;
  const clone = JSON.parse(JSON.stringify(newCycle));
  if (isWithinRange(minutesRemaining)) {
    clone.isDay = !clone.isDay;
    clone.state = clone.state === 'day' ? 'night' : 'day';
    const newEnd = new Date(clone.expiry).getTime() + durations.earth[clone.state];
    clone.id = `earthCycle${newEnd}`;
    clone.activation = clone.expiry;
    clone.expiry = new Date(newEnd);
    delete clone.timeLeft;
    delete clone.shortString;
    minutesRemaining = '';
  } else return undefined;
  return { type: `earth.${clone.state}${minutesRemaining}`, clone };
};

const resolveVallisCycleType = ({ data: newCycle, dirty: cycleChange }) => {
  let minutesRemaining = cycleChange ? '' : `.${Math.round(fromNow(newCycle.expiry) / 60000)}`;
  const clone = JSON.parse(JSON.stringify(newCycle));
  if (isWithinRange(minutesRemaining)) {
    clone.isWarm = !clone.isWarm;
    clone.state = clone.state === 'warm' ? 'cold' : 'warm';
    const newEnd = new Date(clone.expiry).getTime() + durations.vallis[clone.state];
    clone.id = `vallisCycle${newEnd}`;
    clone.activation = clone.expiry;
    clone.expiry = new Date(newEnd);
    delete clone.timeLeft;
    delete clone.shortString;
    minutesRemaining = '';
  } else return undefined;
  return { type: `solaris.${clone.state}${minutesRemaining}`, clone };
};

const resolveDuviriCycleType = ({ data: newCycle, dirty: cycleChange }) => {
  if (!newCycle) return undefined;
  let minutesRemaining = cycleChange ? '' : `.${Math.round(fromNow(newCycle.expiry) / 60000)}`;
  const clone = JSON.parse(JSON.stringify(newCycle));
  if (isWithinRange(minutesRemaining)) {
    clone.state = nextMood(clone.state);
    const newEnd = new Date(clone.expiry).getTime() + durations.duviri;
    clone.id = `duviriCycle${clone.state}${newEnd}`;
    clone.activation = clone.expiry;
    clone.expiry = new Date(newEnd);
    delete clone.timeLeft;
    delete clone.shortString;
    minutesRemaining = '';
  } else return undefined;
  return { type: `duviri.${clone.state}${minutesRemaining}`, clone };
};

const collectCycleClaimIds = (cycles) =>
  [
    resolveCetusCycleType(cycles.cetus)?.type,
    resolveEarthCycleType(cycles.earth)?.type,
    resolveVallisCycleType(cycles.vallis)?.type,
    resolveCambionCycleType(cycles.cambion)?.type,
    cycles.duviri ? resolveDuviriCycleType(cycles.duviri)?.type : undefined,
  ].filter(Boolean);

export default class CycleNotifier {
  #settings;
  #worldStates;
  #broadcaster;
  #ready;
  #claimedIds = null;

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
      locales.forEach((l) => {
        beats[`${p}:${l}`] = {
          lastUpdate: Date.now(),
          currCycleStart: undefined,
        };
      });
    });
    refreshRate = timeout;
    this.#ready = true;
  }

  /** Start the notifier */
  async start() {
    Object.entries(this.#worldStates).forEach(([, ws]) => {
      ws.on('newData', this.#onNewData.bind(this));
    });
  }

  /**
   * Send notifications on new data from worldstate
   * @param  {string} platform Platform to be updated
   * @param {string} locale language/locale of updated worldstate
   * @param  {Object} newData  Updated data from the worldstate
   */
  async #onNewData(platform, locale, newData) {
    if (!this.#ready) return;

    const key = `${platform}:${locale}:cycles`;
    // don't wait for the previous to finish, this creates a giant backup,
    //  adding 4 new entries every few seconds
    if (updating.has(key)) return;

    if (!beats[key]) beats[key] = { lastUpdate: Date.now(), currCycleStart: undefined };
    beats[key].currCycleStart = Date.now();
    if (!newData?.timestamp) return;

    updating.add(key);
    try {
      const notifiedIds = await this.#settings.getNotifiedIds(key);
      await this.#sendNew(platform, locale, newData, notifiedIds, buildNotifiableData(newData, platform, locale), key);
    } catch (e) {
      if (e.message === 'already updating') {
        return;
      }
      throw e;
    } finally {
      updating.remove(key);
    }
  }

  #canSend(claimId) {
    if (!claimId) return false;
    if (!this.#claimedIds) return true;
    return this.#claimedIds.has(String(claimId));
  }

  async #sendNew(platform, locale, rawData, notifiedIds, cycles, key) {
    const deliveredCycleIds = [];
    let claimedIds = new Set();
    const i18n = i18ns[locale];
    try {
      logger.silly(`sending new cycle data on ${platform} for ${locale}...`);
      const claimIds = collectCycleClaimIds(cycles);
      claimedIds = new Set(await this.#settings.claimNotifiedIds(key, claimIds));
      this.#claimedIds = claimedIds;
      if (claimIds.length) {
        logger.debug(`claimed ${claimedIds.size}/${claimIds.length} cycle ids for ${key}`, 'CY');
      }

      const deps = {
        platform,
        i18n,
        locale,
      };
      const maybeDelivered = await this.#sendCetusCycle(cycles.cetus, deps);
      if (maybeDelivered) deliveredCycleIds.push(maybeDelivered);
      const earthDelivered = await this.#sendEarthCycle(cycles.earth, deps);
      if (earthDelivered) deliveredCycleIds.push(earthDelivered);
      const vallisDelivered = await this.#sendVallisCycle(cycles.vallis, deps);
      if (vallisDelivered) deliveredCycleIds.push(vallisDelivered);
      const cambionDelivered = await this.#sendCambionCycle(cycles.cambion, deps);
      if (cambionDelivered) deliveredCycleIds.push(cambionDelivered);
      if (cycles.duviri) {
        const duviriDelivered = await this.#sendDuviriCycle(cycles.duviri, deps);
        if (duviriDelivered) deliveredCycleIds.push(duviriDelivered);
      }
    } catch (e) {
      logger.error(e);
    } finally {
      this.#claimedIds = null;
      beats[key].lastUpdate = Date.now();
    }

    const undelivered = [...claimedIds].filter((id) => !deliveredCycleIds.includes(id));
    if (undelivered.length) {
      await this.#settings.releaseNotifiedIds(key, undelivered);
    }

    const alreadyNotified = [...new Set([...notifiedIds, ...deliveredCycleIds])];

    await this.#settings.setNotifiedIds(key, alreadyNotified);
    logger.silly(`completed sending cycle notifications for ${platform} in ${locale}`);
  }

  async #sendCambionCycle(cycle, { platform, locale, i18n }) {
    const resolved = resolveCambionCycleType(cycle);
    if (!resolved || !this.#canSend(resolved.type)) return undefined;
    const sent = await this.#broadcaster.broadcast(new embeds.Cambion(resolved.clone, { i18n, locale }), {
      platform,
      type: resolved.type,
      locale,
    });
    return sent ? resolved.type : undefined;
  }

  async #sendCetusCycle(cycle, { platform, locale, i18n }) {
    const resolved = resolveCetusCycleType(cycle);
    if (!resolved || !this.#canSend(resolved.type)) return undefined;
    const sent = await this.#broadcaster.broadcast(new embeds.Cycle(resolved.clone, { i18n, locale, platform }), {
      platform,
      type: resolved.type,
      locale,
    });
    return sent ? resolved.type : undefined;
  }

  async #sendEarthCycle(cycle, { platform, locale, i18n }) {
    const resolved = resolveEarthCycleType(cycle);
    if (!resolved || !this.#canSend(resolved.type)) return undefined;
    const sent = await this.#broadcaster.broadcast(new embeds.Cycle(resolved.clone, { i18n, locale, platform }), {
      platform,
      type: resolved.type,
      locale,
    });
    return sent ? resolved.type : undefined;
  }

  async #sendVallisCycle(cycle, { platform, locale, i18n }) {
    const resolved = resolveVallisCycleType(cycle);
    if (!resolved || !this.#canSend(resolved.type)) return undefined;
    const sent = await this.#broadcaster.broadcast(new embeds.Solaris(resolved.clone, { i18n, locale, platform }), {
      platform,
      type: resolved.type,
      locale,
    });
    return sent ? resolved.type : undefined;
  }

  async #sendDuviriCycle(cycle, { platform, locale, i18n }) {
    const resolved = resolveDuviriCycleType(cycle);
    if (!resolved || !this.#canSend(resolved.type)) return undefined;
    const sent = await this.#broadcaster.broadcast(new embeds.Duviri(resolved.clone, { i18n, locale }), {
      platform,
      type: resolved.type,
      locale,
    });
    return sent ? resolved.type : undefined;
  }
}
