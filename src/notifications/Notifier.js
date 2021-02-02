'use strict';

/* eslint-disable no-unused-vars */

const Wikia = require('node-wikia');
const util = require('util');

const exists = util.promisify(require('url-exists'));
const fetch = require('../resources/Fetcher');
const { embeds } = require('./NotifierUtils');
const Broadcaster = require('./Broadcaster');
const logger = require('../Logger');

const {
  createGroupedArray, apiBase, apiCdnBase, platforms, captures,
} = require('../CommonFunctions');

const warframe = new Wikia('warframe');

const syndicates = require('../resources/syndicates.json');
const I18n = require('../settings/I18n');

const i18ns = {};
require('../resources/locales.json').forEach((locale) => {
  i18ns[locale] = I18n.use(locale);
});

const updtReg = new RegExp(captures.updates, 'i');

const beats = {};

let refreshRate = process.env.WORLDSTATE_TIMEOUT || 60000;

const between = (activation, platform) => {
  const activationTs = new Date(activation).getTime();
  const leeway = 9 * (refreshRate / 10);
  const isBeforeCurr = activationTs < (beats[platform].currCycleStart);
  const isAfterLast = activationTs > (beats[platform].lastUpdate - (leeway));
  return isBeforeCurr && isAfterLast;
};

async function getThumbnailForItem(query, fWiki) {
  if (query && !fWiki) {
    const fq = query
      .replace(/\d*\s*((?:\w|\s)*)\s*(?:blueprint|receiver|stock|barrel|blade|gauntlet|upper limb|lower limb|string|guard|neuroptics|systems|chassis|link)?/ig, '$1')
      .trim().toLowerCase();
    const results = await fetch(`${apiBase}/items/search/${encodeURIComponent(fq)}`);
    if (results.length) {
      const url = `${apiCdnBase}img/${results[0].imageName}`;
      if (await exists(url)) {
        return url;
      }
    }
    // try {
    //   const articles = await warframe.getSearchList({ query: fq, limit: 1 });
    //   const details = await warframe.getArticleDetails({ ids: articles.items.map(i => i.id) });
    //   const item = Object.values(details.items)[0];
    //   return item && item.thumbnail ? item.thumbnail.replace(/\/revision\/.*/, '') : undefined;
    // } catch (e) {
    //   logger.error(e);
    // }
  }
  return '';
}

/**
 * Returns the number of milliseconds between now and a given date
 * @param   {string} d         The date from which the current time will be subtracted
 * @param   {function} [now] A function that returns the current UNIX time in milliseconds
 * @returns {number}
 */
function fromNow(d, now = Date.now) {
  return new Date(d).getTime() - now();
}

function buildNotifiableData(newData, platform, notified) {
  const data = {
    acolytes: newData.persistentEnemies.filter(e => !notified.includes(e.pid)),
    alerts: newData.alerts.filter(a => !a.expired && !notified.includes(a.id)),
    baro: newData.voidTrader && !notified.includes(`${newData.voidTrader.id}${newData.voidTrader.active ? '1' : '0'}`)
      ? newData.voidTrader
      : undefined,
    conclave: newData.conclaveChallenges
      .filter(cc => !cc.expired && !cc.rootChallenge && !notified.includes(cc.id)),
    dailyDeals: newData.dailyDeals.filter(dd => !notified.includes(dd.id)),
    events: newData.events.filter(e => !e.expired && !notified.includes(e.id)),
    invasions: newData.invasions.filter(i => i.rewardTypes.length && !notified.includes(i.id)),
    featuredDeals: newData.flashSales
      .filter(d => d.isFeatured && !notified.includes(d.id)),
    fissures: newData.fissures
      .filter(f => f.active && !notified.includes(f.id)),
    news: newData.news
      .filter(n => !n.primeAccess && !n.update
        && !updtReg.test(n.message) && !n.stream && !notified.includes(n.id)),
    popularDeals: newData.flashSales.filter(d => d.isPopular && !notified.includes(d.id)),
    primeAccess: newData.news.filter(n => n.primeAccess && !n.stream && !notified.includes(n.id)),
    sortie: newData.sortie
      && !newData.sortie.expired && !notified.includes(newData.sortie.id)
      ? newData.sortie
      : undefined,
    streams: newData.news.filter(n => n.stream && !notified.includes(n.id)),
    syndicateM: newData.syndicateMissions.filter(m => !notified.includes(m.id)),
    tweets: newData.twitter
      ? newData.twitter.filter(t => t && !notified.includes(t.uniqueId))
      : [],
    updates: newData.news.filter(n => (n.update || !updtReg.test(n.message))
        && !n.stream && !notified.includes(n.id)),

    /* Cycles data */
    cetusCycleChange: between(newData.cetusCycle.activation, platform),
    earthCycleChange: between(newData.earthCycle.activation, platform),
    vallisCycleChange: between(newData.vallisCycle.activation, platform),
    cambionCycleChange: between(newData.cambionCycle.activation, platform),
    cambionCycle: newData.cambionCycle,
    cetusCycle: newData.cetusCycle,
    earthCycle: newData.earthCycle,
    vallisCycle: newData.vallisCycle,
    arbitration: newData.arbitration && newData.arbitration.enemy
        && !notified.includes(`arbitration:${new Date(newData.arbitration.expiry).getTime()}`)
      ? newData.arbitration
      : undefined,
    outposts: newData.sentientOutposts.active && !notified.includes(newData.sentientOutposts.id),
  };

  const ostron = newData.syndicateMissions.filter(mission => mission.syndicate === 'Ostrons')[0];
  if (ostron) {
    data.cetusCycle.bountyExpiry = ostron.expiry;
  }

  /* Nightwave */
  if (newData.nightwave) {
    const nWaveChallenges = newData.nightwave.activeChallenges
      .filter(challenge => challenge.active && !notified.includes(challenge.id));
    data.nightwave = nWaveChallenges.length
      ? ({ ...JSON.parse(JSON.stringify(newData.nightwave)) })
      : undefined;
    if (data.nightwave) {
      data.nightwave.activeChallenges = nWaveChallenges;
    }
  }

  return data;
}

/**
 * Notifier for alerts, invasions, etc.
 */
class Notifier {
  constructor({
    settings, client, messageManager, worldStates, timeout, workerCache,
  }) {
    this.settings = settings;
    this.client = client;
    this.worldStates = worldStates;
    this.broadcaster = new Broadcaster({
      client,
      settings: this.settings,
      messageManager,
      workerCache,
    });
    logger.info('[N] Ready');

    platforms.forEach((p) => {
      beats[p] = {
        lastUpdate: Date.now(),
        currCycleStart: null,
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

    const notifiedIds = await this.settings.getNotifiedIds(platform);

    // Set up data to notify
    this.updating.push(platform);

    await this.sendNew(platform, newData, notifiedIds,
      buildNotifiableData(newData, platform, notifiedIds));

    this.updating.splice(this.updating.indexOf(platform), 1);
  }

  async sendNew(platform, rawData, notifiedIds, {
    alerts, arbitration, dailyDeals, events, fissures,
    invasions, news, acolytes, sortie, syndicateM, baro,
    cetusCycle, earthCycle, vallisCycle, tweets, nightwave,
    cetusCycleChange, earthCycleChange, vallisCycleChange,
    featuredDeals, streams, popularDeals, primeAccess, updates, conclave,
    cambionCycle, cambionCycleChange, outposts,
  }) {
    // Send all notifications
    const cycleIds = [];
    try {
      logger.silly(`[N] sending new data on ${platform}...`);

      this.sendAcolytes(acolytes, platform);

      if (baro) {
        this.sendBaro(baro, platform);
      }
      if (conclave && conclave.length > 0) {
        this.sendConclaveDailies(conclave, platform);
        this.sendConclaveWeeklies(conclave, platform);
      }
      if (tweets && tweets.length > 0) {
        this.sendTweets(tweets, platform);
      }
      this.sendDarvo(dailyDeals, platform);
      this.sendEvent(events, platform);
      this.sendFeaturedDeals(featuredDeals, platform);
      this.sendFissures(fissures, platform);
      this.sendNews(news, platform);
      this.sendStreams(streams, platform);
      this.sendPopularDeals(popularDeals, platform);
      this.sendPrimeAccess(primeAccess, platform);
      this.sendInvasions(invasions, platform);
      this.sendSortie(sortie, platform);
      this.sendSyndicates(syndicateM, platform);
      this.sendUpdates(updates, platform);
      this.sendAlerts(alerts, platform);
      this.sendSentientOutposts(outposts, platform);
      this.sendNightwave(nightwave, platform);
      this.sendArbitration(arbitration, platform);
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
      ...rawData.persistentEnemies.map(a => a.pid),
      ...cycleIds,
      `${rawData.voidTrader.id}${rawData.voidTrader.active ? '1' : '0'}`,
      ...rawData.fissures.map(f => f.id),
      ...rawData.invasions.map(i => i.id),
      ...rawData.news.map(n => n.id),
      ...rawData.events.map(e => e.id),
      ...rawData.alerts.map(a => a.id),
      rawData.sortie.id,
      ...rawData.syndicateMissions.map(m => m.id),
      ...rawData.flashSales.map(s => s.id),
      ...rawData.dailyDeals.map(d => d.id),
      ...rawData.conclaveChallenges.map(cc => cc.id),
      ...rawData.weeklyChallenges.map(w => w.id),
      rawData.arbitration && rawData.arbitration.enemy
        ? `arbitration:${new Date(rawData.arbitration.expiry).getTime()}`
        : 'arbitration:0',
      ...(rawData.twitter ? rawData.twitter.map(t => t.uniqueId) : []),
      ...(rawData.nightwave && rawData.nightwave.active
        ? rawData.nightwave.activeChallenges.map(c => c.id)
        : []),
      rawData.sentientOutposts.id,
    ];

    await this.settings.setNotifiedIds(platform, alreadyNotified);
  }

  async sendAcolytes(newAcolytes, platform) {
    for (const acolyte of newAcolytes) {
      await this.broadcaster.broadcast(new embeds.Acolyte(
        { logger },
        [acolyte], platform,
      ), platform, `enemies${acolyte.isDiscovered ? '' : '.departed'}`);
    }
    return true;
  }

  async sendAlerts(newAlerts, platform) {
    for (const alert of newAlerts) {
      await this.sendAlert(alert, platform);
    }
    return true;
  }

  async sendAlert(a, platform) {
    for (const [locale, i18n] of Object.entries(i18ns)) {
      const embed = new embeds.Alert({ logger }, [a], platform, i18n);
      embed.locale = locale;
      try {
        const thumb = await getThumbnailForItem(a.mission.reward.itemString);
        if (thumb && !a.rewardTypes.includes('reactor') && !a.rewardTypes.includes('catalyst')) {
          embed.thumbnail.url = thumb;
        }
      } catch (e) {
        logger.error(e);
      } finally {
        // Broadcast even if the thumbnail fails to fetch
        await this.broadcaster.broadcast(embed, platform, 'alerts', a.rewardTypes);
      }
    }
    return true;
  }

  async sendArbitration(arbitration, platform) {
    if (!arbitration || !arbitration.enemy) return;

    for (const [locale, i18n] of Object.entries(i18ns)) {
      const embed = new embeds.Arbitration({ logger }, arbitration, platform, i18n);
      embed.locale = locale;
      const type = `arbitration.${arbitration.enemy.toLowerCase()}.${arbitration.type.replace(/\s/g, '').toLowerCase()}`;
      await this.broadcaster.broadcast(embed, platform, type);
    }
  }

  async sendBaro(newBaro, platform) {
    const embed = new embeds.VoidTrader({ logger }, newBaro, platform);
    if (embed.fields.length > 25) {
      const pages = createGroupedArray(embed.fields, 15);
      for (const page of pages) {
        const tembed = { ...embed };
        tembed.fields = page;
        await this.broadcaster.broadcast(tembed, platform, 'baro');
      }
    } else {
      await this.broadcaster.broadcast(embed, platform, 'baro');
    }
  }

  async sendCambionCycle(newCycle, platform, cycleChange, notifiedIds) {
    const minutesRemaining = cycleChange ? '' : `.${Math.round(fromNow(newCycle.expiry) / 60000)}`;
    const type = `cambion.${newCycle.active}${minutesRemaining}`;
    if (!notifiedIds.includes(type)) {
      await this.broadcaster.broadcast(
        new embeds.Cambion({ logger }, newCycle), platform, type,
      );
    }
    return type;
  }

  async sendCetusCycle(newCycle, platform, cycleChange, notifiedIds) {
    const minutesRemaining = cycleChange ? '' : `.${Math.round(fromNow(newCycle.expiry) / 60000)}`;
    const type = `cetus.${newCycle.isDay ? 'day' : 'night'}${minutesRemaining}`;
    const embed = new embeds.Cycle({ logger }, newCycle);
    if (!notifiedIds.includes(type)) {
      await this.broadcaster.broadcast(embed, platform, type);
    }
    return type;
  }

  async sendConclaveDailies(newDailies, platform) {
    const dailies = newDailies.filter(challenge => challenge.category === 'day');
    if (dailies.length > 0 && dailies[0].activation) {
      const embed = new embeds.Conclave({ logger }, dailies, 'day', platform);
      await this.broadcaster.broadcast(embed, platform, 'conclave.dailies');
    }
  }

  async sendConclaveWeeklies(newWeeklies, platform) {
    const weeklies = newWeeklies.filter(challenge => challenge.category === 'week');
    if (weeklies.length > 0) {
      const embed = new embeds.Conclave({ logger }, weeklies, 'week', platform);
      await this.broadcaster.broadcast(embed, platform, 'conclave.weeklies');
    }
  }

  async sendDarvo(newDarvoDeals, platform) {
    for (const deal of newDarvoDeals) {
      await this.broadcaster.broadcast(new embeds.Darvo({ logger }, deal, platform), platform, 'darvo');
    }
  }

  async sendEarthCycle(newCycle, platform, cycleChange, notifiedIds) {
    const minutesRemaining = cycleChange ? '' : `.${Math.round(fromNow(newCycle.expiry) / 60000)}`;
    const type = `earth.${newCycle.isDay ? 'day' : 'night'}${minutesRemaining}`;
    if (!notifiedIds.includes(type)) {
      await this.broadcaster.broadcast(
        new embeds.Cycle({ logger }, newCycle), platform, type,
      );
    }
    return type;
  }

  async sendEvent(newEvents, platform) {
    return Promise.all(newEvents
      .map(e => this.broadcaster.broadcast(new embeds.Event({ logger }, e, platform), platform, 'operations')));
  }

  async sendFeaturedDeals(newFeaturedDeals, platform) {
    return Promise.all(newFeaturedDeals
      .map(d => this.broadcaster.broadcast(new embeds.Sales({ logger }, [d], platform), platform, 'deals.featured')));
  }

  async sendFissures(newFissures, platform) {
    return Promise.all(newFissures
      .map(fissure => this.sendFissure(fissure, platform)));
  }

  async sendFissure(fissure, platform) {
    for (const [locale, i18n] of Object.entries(i18ns)) {
      const embed = new embeds.Fissure({ logger }, [fissure], platform, i18n);
      embed.locale = locale;
      const id = `fissures.t${fissure.tierNum}.${fissure.missionType.toLowerCase().replace(/\s/g, '')}`;
      await this.broadcaster.broadcast(embed, platform, id);
    }
  }

  async sendInvasions(newInvasions, platform) {
    await Promise.all(newInvasions
      .map(invasion => this.sendInvasion(invasion, platform)));
  }

  async sendInvasion(invasion, platform) {
    for (const [locale, i18n] of Object.entries(i18ns)) {
      const embed = new embeds.Invasion({ logger }, [invasion], platform, i18n);
      embed.locale = locale;
      try {
        const reward = invasion.attackerReward.itemString || invasion.defenderReward.itemString;
        const thumb = await getThumbnailForItem(reward);
        if (thumb && !invasion.rewardTypes.includes('reactor') && !invasion.rewardTypes.includes('catalyst')) {
          embed.thumbnail.url = thumb;
        }
      } catch (e) {
        // do nothing, it happens
      } finally {
        await this.broadcaster.broadcast(embed, platform, 'invasions', invasion.rewardTypes);
      }
    }
  }

  async sendNews(newNews, platform) {
    return Promise.all(newNews.map(i => this.broadcaster.broadcast(new embeds.News({ logger }, [i], undefined, platform), platform, 'news')));
  }

  async sendNightwave(nightwave, platform) {
    const makeType = (challenge) => {
      let type = 'daily';

      if (challenge.isElite) {
        type = 'elite';
      } else if (!challenge.isDaily) {
        type = 'weekly';
      }
      return `nightwave.${type}`;
    };

    if (!nightwave) return;
    for (const [locale, i18n] of Object.entries(i18ns)) {
      if (nightwave.activeChallenges.length > 1) {
        nightwave.activeChallenges.forEach(async (challenge) => {
          const nwCopy = { ...nightwave };
          nwCopy.activeChallenges = [challenge];
          const embed = new embeds.Nightwave({ logger }, nwCopy, platform, i18n);
          embed.locale = locale;
          await this.broadcaster.broadcast(embed, platform,
            makeType(challenge));
        });
      } else {
        const embed = new embeds.Nightwave({ logger }, nightwave, platform, i18n);
        embed.locale = locale;
        await this.broadcaster.broadcast(embed, platform, 'nightwave');
      }
    }
  }

  async sendPopularDeals(newPopularDeals, platform) {
    return Promise.all(newPopularDeals
      .map(d => this.broadcaster.broadcast(new embeds.Sales({ logger }, [d], platform), platform, 'deals.popular')));
  }

  async sendPrimeAccess(newNews, platform) {
    return Promise.all(newNews
      .map(i => this.broadcaster.broadcast(new embeds.News({ logger }, [i], 'primeaccess', platform), platform, 'primeaccess')));
  }

  async sendSortie(newSortie, platform) {
    if (!newSortie) return;
    const embed = new embeds.Sortie({ logger }, newSortie, platform);
    try {
      const thumb = await getThumbnailForItem(newSortie.boss, true);
      if (thumb) {
        embed.thumbnail.url = thumb;
      }
    } catch (e) {
      logger.error(e);
    } finally {
      await this.broadcaster.broadcast(embed, platform, 'sorties');
    }
  }

  async sendStreams(newStreams, platform) {
    return Promise.all(newStreams.map(i => this.broadcaster.broadcast(new embeds.News({ logger }, [i], undefined, platform), platform, 'streams')));
  }

  async checkAndSendSyndicate(embed, syndicate, platform) {
    if (embed.description && embed.description.length > 0 && embed.description !== 'No such Syndicate') {
      await this.broadcaster.broadcast(embed, platform, syndicate);
    }
  }

  async sendSyndicates(newSyndicates, platform) {
    if (!newSyndicates || !newSyndicates[0]) return;
    for (const {
      key, display, prefix, notifiable,
    } of syndicates) {
      if (notifiable) {
        const embed = new embeds.Syndicate({ logger }, newSyndicates, display, platform);
        const eKey = `${prefix || ''}${key}`;
        await this.checkAndSendSyndicate(embed, eKey, platform);
      }
    }
  }

  async sendTweets(newTweets, platform) {
    return Promise.all(newTweets.map(t => this.broadcaster
      .broadcast(new embeds.Tweet({ logger }, t), platform, t.id)));
  }

  async sendUpdates(newNews, platform) {
    return Promise.all(newNews.map(i => this.broadcaster.broadcast(new embeds.News({ logger }, [i], 'updates', platform), platform, 'updates')));
  }

  async sendVallisCycle(newCycle, platform, cycleChange, notifiedIds) {
    const minutesRemaining = cycleChange ? '' : `.${Math.round(fromNow(newCycle.expiry) / 60000)}`;
    const type = `solaris.${newCycle.isWarm ? 'warm' : 'cold'}${minutesRemaining}`;
    if (!notifiedIds.includes(type)) {
      await this.broadcaster.broadcast(
        new embeds.Solaris({ logger }, newCycle), platform, type,
      );
    }
    return type;
  }

  async sendSentientOutposts(outpost, platform) {
    for (const [locale, i18n] of Object.entries(i18ns)) {
      if (outpost.mission) {
        const embed = new embeds.Outposts({ logger }, outpost, platform, i18n);
        embed.locale = locale;
        await this.broadcaster.broadcast(embed, platform, 'outposts');
      }
    }
  }
}

module.exports = Notifier;
