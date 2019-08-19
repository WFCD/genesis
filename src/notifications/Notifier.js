'use strict';

const Wikia = require('node-wikia');
const fetch = require('../resources/Fetcher');

const { embeds } = require('./NotifierUtils');
const Broadcaster = require('./Broadcaster');

const {
  createGroupedArray, apiBase, apiCdnBase, platforms,
} = require('../CommonFunctions');


const warframe = new Wikia('warframe');

const syndicates = require('../resources/syndicates.json');
const I18n = require('../settings/I18n');

const i18ns = {};
require('../resources/locales.json').forEach((locale) => {
  i18ns[locale] = I18n.use(locale);
});

const beats = {};

const between = (activation, platform) => {
  const activationTs = new Date(activation).getTime();
  const isBeforeCurr = activationTs < beats[platform].currCycleStart;
  const isAfterLast = activationTs > (beats[platform].lastUpdate - 60000);
  return isBeforeCurr && isAfterLast;
};

/**
 * Returns the number of milliseconds between now and a given date
 * @param   {string} d         The date from which the current time will be subtracted
 * @param   {function} [now] A function that returns the current UNIX time in milliseconds
 * @returns {number}
 */
function fromNow(d, now = Date.now) {
  return new Date(d).getTime() - now();
}

function buildNotifiableData(ids, newData) {
  const data = {};
  data.acolytes = newData.persistentEnemies
    .filter(e => !ids.includes(e.pid));
  data.alerts = newData.alerts
    .filter(a => !ids.includes(a.id) && !a.expired);
  data.baro = newData.voidTrader && !ids.includes(newData.voidTrader.psId)
    ? newData.voidTrader : undefined;
  data.conclave = newData.conclaveChallenges
    .filter(cc => !ids.includes(cc.id) && !cc.expired && !cc.rootChallenge);
  data.dailyDealsToNotify = newData.dailyDeals.filter(d => !ids.includes(d.id));
  data.events = newData.events
    .filter(e => !ids.includes(e.id) && !e.expired);
  data.invasions = newData.invasions
    .filter(i => !ids.includes(i.id) && i.rewardTypes.length);
  data.featuredDeals = newData.flashSales
    .filter(d => !ids.includes(d.id) && d.isFeatured);
  data.fissures = newData.fissures
    .filter(f => !ids.includes(f.id) && !f.expired);
  data.news = newData.news
    .filter(n => !ids.includes(n.id)
            && !n.primeAccess && !n.update && !n.stream && n.translations.en);
  data.popularDeals = newData.flashSales
    .filter(d => !ids.includes(d.id) && d.isPopular);
  data.primeAccess = newData.news
    .filter(n => !ids.includes(n.id) && n.primeAccess && !n.stream && n.translations.en);
  data.sortie = newData.sortie && !ids.includes(newData.sortie.id)
      && !newData.sortie.expired ? newData.sortie : undefined;
  data.syndicates = newData.syndicateMissions.filter(m => !ids.includes(m.id));
  data.updates = newData.news
    .filter(n => !ids.includes(n.id) && n.update && !n.stream && n.translations.en);
  data.streams = newData.news
    .filter(n => !ids.includes(n.id) && n.stream && n.translations.en);
  data.tweets = newData.twitter
    ? newData.twitter.filter(t => !ids.includes(t.uniqueId)) : [];
  data.cetusCycleChange = !ids.includes(newData.cetusCycle.id) && newData.cetusCycle.expiry;
  data.earthCycleChange = !ids.includes(newData.earthCycle.id) && newData.earthCycle.expiry;
  data.vallisCycleChange = !ids.includes(newData.vallisCycle.id) && newData.vallisCycle.expiry;

  if (newData.nightwave) {
    const nWaveChallenges = newData.nightwave.activeChallenges
      .filter(challenge => !ids.includes(challenge.id) && challenge.active);
    data.nWaveIds = newData.nightwave.activeChallenges
      .filter(challenge => challenge.active)
      .map(challenge => challenge.id);
    data.nightwave = nWaveChallenges.length
      ? Object.assign({}, JSON.parse(JSON.stringify(newData.nightwave)))
      : undefined;
    if (data.nightwave) {
      data.nightwave.activeChallenges = nWaveChallenges;
    }
  }
}

/**
 * Notifier for alerts, invasions, etc.
 *   TODO: remove dependence on 'bot', use something like https://github.com/spec-tacles/rest.js
 *     to leverage direct api routing/calls with ratelimit support
 *     use this in place of bot calls to queue up role changes,
 *     and separate the notifications from the rest of the bot functionality
 */
class Notifier {
  /**
   * * Set up essential notifier dependencies
   * * Get rid of all external pull-ins
   * rewrite to not use a bot client, but a direct api router
   * * Instantiate our own logger
   * * Instantiate our own db connection
   * @param {Genesis} bot instance of the bot.... this needs to be refactored/removed
   */
  constructor(bot) {
    this.bot = bot;
    this.logger = bot.logger;
    this.settings = bot.settings;
    this.client = bot.client;
    this.broadcaster = new Broadcaster({
      client: bot.client,
      settings: this.settings,
      messageManager: bot.messageManager,
      logger: bot.logger,
    });
    this.logger.info('[Notifier] Ready');

    platforms.forEach((p) => {
      beats[p] = {
        lastUpdate: Date.now(),
        currCycleStart: null,
      };
    });
  }

  /**
   * Start the notifier
   */
  async start() {
    for (const k of Object.keys(this.bot.worldStates)) {
      if (k === 'pc') {
        this.bot.worldStates[k].on('newData', async (platform, newData) => {
          this.logger.info(`[Notifier] Processing new data for ${platform}`);
          await this.onNewData(platform, newData);
        });
      }
    }
  }

  /**
   * Send notifications on new data from worldstate
   * @param  {string} platform Platform to be updated
   * @param  {json} newData  Updated data from the worldstate
   */
  async onNewData(platform, newData) {
    beats[platform].currCycleStart = Date.now();
    if (!(newData && newData.timestamp)) return;

    const ids = await this.getNotifiedIds(platform);
    // Set up data to notify
    const {
      alerts, dailyDeals, events, fissures, flashSales,
      invasions, news, acolytes, sortie, syndicateMissions, baro,
      cetusCycle, earthCycle, vallisCycle, tweets, nightwave,
      cetusCycleChange, earthCycleChange, vallisCycleChange,
      featuredDeals, streams, popularDeals, primeAccess, updates, conclave,
    } = buildNotifiableData(ids, newData);

    // Concat all notified ids
    const notifiedIds = []
      .concat(alerts.map(a => a.id))
      .concat(conclave.map(c => c.id))
      .concat(dailyDeals.map(d => d.id))
      .concat(events.map(e => e.id))
      .concat(fissures.map(f => f.id))
      .concat(flashSales.map(d => d.id))
      .concat(invasions.map(i => i.id))
      .concat(news.map(n => n.id))
      .concat(acolytes.map(p => p.pid))
      .concat(sortie ? [sortie.id] : [])
      .concat(syndicateMissions.map(m => m.id))
      .concat(baro ? [`${baro.id}${baro.inventory.length}`] : [])
      .concat([cetusCycle.id])
      .concat([earthCycle.id])
      .concat([vallisCycle.id])
      .concat(tweets ? tweets.map(t => t.uniqueId) : [])
      .concat(nightwave && nightwave.activeChallenges ? nightwave.activeChallenges.map(c => c.id) : []);

    // Send all notifications
    try {
      await this.sendAcolytes(acolytes, platform);
      if (baro) {
        this.sendBaro(baro, platform);
      }
      if (conclave && conclave.length > 0) {
        this.sendConclaveDailies(conclave, platform);
        await this.sendConclaveWeeklies(conclave, platform);
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
      if (sortie) {
        await this.sendSortie(sortie, platform);
      }
      if (syndicates && syndicates.length > 0) {
        await this.sendSyndicates(syndicates, platform);
      }
      const ostron = newData.syndicateMissions.filter(mission => mission.syndicate === 'Ostrons')[0];
      if (ostron) {
        // eslint-disable-next-line no-param-reassign
        cetusCycle.bountyExpiry = ostron.expiry;
      }
      await this.sendCetusCycle(cetusCycle, platform, cetusCycleChange);
      await this.sendEarthCycle(earthCycle, platform, earthCycleChange);

      await this.sendVallisCycle(vallisCycle, platform, vallisCycleChange);
      this.sendUpdates(updates, platform);
      await this.sendAlerts(alerts, platform);
      await this.sendNightwave(nightwave, platform);
    } catch (e) {
      this.logger.error(e);
    } finally {
      await this.updateNotified(notifiedIds, platform);
      beats[platform].lastUpdate = Date.now();
    }
  }

  /**
   * Get the list of notified ids
   * @param  {string} platform Platform to get notified ids for
   * @returns {Array}
   */
  async getNotifiedIds(platform) {
    return this.bot.settings.getNotifiedIds(platform, this.bot.clusterId);
  }

  /**
   * Set the notified ids for a given platform and shard id
   * @param {JSON} ids list of oids that have been notifiedIds
   * @param {string} platform    platform corresponding to notified ids
   */
  async updateNotified(ids, platform) {
    await this.settings.setNotifiedIds(platform, this.bot.clusterId, ids);
  }

  async getThumbnailForItem(query, fWiki) {
    if (query && !fWiki) {
      const fq = query
        .replace(/\d*\s*((?:\w|\s)*)\s*(?:blueprint|receiver|stock|barrel|blade|gauntlet|upper limb|lower limb|string|guard|neuroptics|systems|chassis|link)?/ig, '$1')
        .trim().toLowerCase();
      const results = await fetch(`${apiBase}/items/search/${encodeURIComponent(fq)}`);
      if (results.length) {
        const url = `${apiCdnBase}img/${results[0].imageName}`;
        const getImg = await fetch(url);
        if (getImg.ok) {
          return url;
        }
      }
      try {
        const articles = await warframe.getSearchList({ query: fq, limit: 1 });
        const details = await warframe.getArticleDetails({ ids: articles.items.map(i => i.id) });
        const item = Object.values(details.items)[0];
        return item && item.thumbnail ? item.thumbnail.replace(/\/revision\/.*/, '') : undefined;
      } catch (e) {
        this.logger.error(e);
      }
    }
    return undefined;
  }

  async sendAcolytes(newAcolytes, platform) {
    await Promise.all(newAcolytes.map(async a => this.broadcaster.broadcast(new embeds.Enemy(
      this.bot,
      [a], platform,
    ), platform, `enemies${a.isDiscovered ? '' : '.departed'}`, null, 3600000)));
  }

  async sendAlerts(newAlerts, platform) {
    await Promise.all(newAlerts.map(async a => this.sendAlert(a, platform)));
  }

  async sendAlert(a, platform) {
    Object.entries(i18ns).forEach(async ([locale, i18n]) => {
      const embed = new embeds.Alert(this.bot, [a], platform, i18n);
      embed.locale = locale;
      try {
        const thumb = await this.getThumbnailForItem(a.mission.reward.itemString);
        if (thumb && !a.rewardTypes.includes('reactor') && !a.rewardTypes.includes('catalyst')) {
          embed.thumbnail.url = thumb;
        }
      } catch (e) {
        this.logger.error(e);
      } finally {
        // Broadcast even if the thumbnail fails to fetch
        await this.broadcaster.broadcast(embed, platform, 'alerts', a.rewardTypes, fromNow(a.expiry));
      }
    });
  }

  async sendBaro(newBaro, platform) {
    const embed = new embeds.VoidTrader(this.bot, newBaro, platform);
    if (!(newBaro.activation && between(newBaro.activation, platform))) return;

    if (embed.fields.length > 25) {
      const fields = createGroupedArray(embed.fields, 15);
      fields.forEach(async (fieldGroup) => {
        const tembed = Object.assign({}, embed);
        tembed.fields = fieldGroup;
        await this.broadcaster.broadcast(tembed, platform, 'baro', null);
      });
    } else {
      await this.broadcaster.broadcast(embed, platform, 'baro', null);
    }
  }

  async sendCetusCycle(newCetusCycle, platform, cetusCycleChange) {
    const minutesRemaining = cetusCycleChange ? '' : `.${Math.round(fromNow(newCetusCycle.expiry) / 60000)}`;
    const type = `cetus.${newCetusCycle.isDay ? 'day' : 'night'}${minutesRemaining}`;
    await this.broadcaster.broadcast(
      new embeds.Cycle(this.bot, newCetusCycle),
      platform, type, null, fromNow(newCetusCycle.expiry),
    );
  }

  async sendConclaveDailies(newDailies, platform) {
    const dailies = newDailies.filter(challenge => challenge.category === 'day');
    if (dailies.length > 0 && (dailies[0].activation
      && between(dailies[0].activation, platform))) {
      const embed = new embeds.Conclave(this.bot, dailies, 'day', platform);
      await this.broadcaster.broadcast(embed, platform, 'conclave.dailies', null, fromNow(dailies[0].expiry));
    }
  }

  async sendConclaveWeeklies(newWeeklies, platform) {
    const weeklies = newWeeklies.filter(challenge => challenge.category === 'week');
    if (weeklies.length > 0 && (weeklies[0].activation
      && between(weeklies[0].activation, platform))) {
      const embed = new embeds.Conclave(this.bot, weeklies, 'week', platform);
      await this.broadcaster.broadcast(embed, platform, 'conclave.weeklies', null, fromNow(weeklies[0].expiry));
    }
  }

  async sendDarvo(newDarvoDeals, platform) {
    await Promise.all(newDarvoDeals.map((d) => {
      if (!(d.activation
        && between(d.activation, platform))) return false;
      return this.broadcaster.broadcast(new embeds.Darvo(this.bot, d, platform), platform, 'darvo', null, fromNow(d.expiry));
    }));
  }

  async sendEarthCycle(newEarthCycle, platform, cetusCycleChange) {
    const minutesRemaining = cetusCycleChange ? '' : `.${Math.round(fromNow(newEarthCycle.expiry) / 60000)}`;
    const type = `earth.${newEarthCycle.isDay ? 'day' : 'night'}${minutesRemaining}`;
    await this.broadcaster.broadcast(
      new embeds.Cycle(this.bot, newEarthCycle),
      platform, type, null, fromNow(newEarthCycle.expiry),
    );
  }

  async sendEvent(newEvents, platform) {
    await Promise.all(newEvents.map((e) => {
      if (!(e.activation
        && between(e.activation, platform))) return false;

      return this.broadcaster.broadcast(new embeds.Event(this.bot, e, platform), platform, 'operations', null, fromNow(e.expiry));
    }));
  }

  async sendFeaturedDeals(newFeaturedDeals, platform) {
    await Promise.all(newFeaturedDeals.map((d) => {
      if (!(d.activation
        && between(d.activation, platform))) return false;
      return this.broadcaster.broadcast(new embeds.Sales(this.bot, [d], platform), platform, 'deals.featured', null, fromNow(d.expiry));
    }));
  }

  async sendFissures(newFissures, platform) {
    await Promise.all(newFissures.map(fissure => this.sendFissure(fissure, platform)));
  }

  async sendFissure(fissure, platform) {
    if (!(fissure.activation
      && between(fissure.activation, platform))) return;
    Object.entries(i18ns).forEach(async ([locale, i18n]) => {
      const embed = new embeds.Fissure(this.bot, [fissure], platform, i18n);
      embed.locale = locale;
      const id = `fissures.t${fissure.tierNum}.${fissure.missionType.toLowerCase()}`;
      await this.broadcaster.broadcast(embed, platform, id, null, fromNow(fissure.expiry));
    });
  }

  async sendInvasions(newInvasions, platform) {
    await Promise.all(newInvasions.map(invasion => this.sendInvasion(invasion, platform)));
  }

  async sendInvasion(invasion, platform) {
    if (!(invasion.activation
      && between(invasion.activation, platform))) return;
    Object.entries(i18ns).forEach(async ([locale, i18n]) => {
      const embed = new embeds.Invasion(this.bot, [invasion], platform, i18n);
      embed.locale = locale;
      try {
        const reward = invasion.attackerReward.itemString || invasion.defenderReward.itemString;
        const thumb = await this.getThumbnailForItem(reward);
        if (thumb && !invasion.rewardTypes.includes('reactor') && !invasion.rewardTypes.includes('catalyst')) {
          embed.thumbnail.url = thumb;
        }
      } catch (e) {
        // do nothing, it happens
      } finally {
        await this.broadcaster.broadcast(embed, platform, 'invasions', invasion.rewardTypes, 86400000);
      }
    });
  }

  async sendNews(newNews, platform) {
    await Promise.all(newNews.map((i) => {
      if (!(i.date && between(i.date, platform))) return false;
      return this.broadcaster.broadcast(new embeds.News(this.bot, [i], undefined, platform), platform, 'news');
    }));
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
    Object.entries(i18ns).forEach(async ([locale, i18n]) => {
      if (nightwave.activeChallenges.length > 1) {
        nightwave.activeChallenges.forEach(async (challenge) => {
          const nwCopy = Object.assign({}, nightwave);
          nwCopy.activeChallenges = [challenge];
          const embed = new embeds.Nightwave(this.bot, nwCopy, platform, i18n);
          embed.locale = locale;
          await this.broadcaster.broadcast(embed, platform,
            makeType(challenge), null, fromNow(challenge.expiry));
        });
      } else {
        const embed = new embeds.Nightwave(this.bot, nightwave, platform, i18n);
        embed.locale = locale;
        await this.broadcaster.broadcast(embed, platform, 'nightwave', null, fromNow(nightwave.expiry));
      }
    });
  }

  async sendPopularDeals(newPopularDeals, platform) {
    await Promise.all(newPopularDeals.map((d) => {
      if (!(d.date && between(d.date, platform))) return false;
      return this.broadcaster.broadcast(new embeds.Sales(this.bot, [d], platform), platform, 'deals.popular', null, 86400000);
    }));
  }

  async sendPrimeAccess(newNews, platform) {
    await Promise.all(newNews.map((i) => {
      if (!(i.date && between(i.date, platform))) return false;
      return this.broadcaster.broadcast(new embeds.News(this.bot, [i], 'primeaccess', platform), platform, 'primeaccess');
    }));
  }

  async sendSortie(newSortie, platform) {
    if (!(newSortie.activation
      && between(newSortie.activation, platform))) return;
    const embed = new embeds.Sortie(this.bot, newSortie, platform);
    try {
      const thumb = await this.getThumbnailForItem(newSortie.boss, true);
      if (thumb) {
        embed.thumbnail.url = thumb;
      }
    } catch (e) {
      this.logger.error(e);
    } finally {
      await this.broadcaster.broadcast(embed, platform, 'sorties', null, fromNow(newSortie.expiry));
    }
  }

  async sendStreams(newStreams, platform) {
    await Promise.all(newStreams.map((i) => {
      if (!(i.date && between(i.date, platform))) return false;
      return this.broadcaster.broadcast(new embeds.News(this.bot, [i], undefined, platform), platform, 'streams');
    }));
  }

  async checkAndSendSyndicate(embed, syndicate, timeout, platform) {
    if (embed.description && embed.description.length > 0 && embed.description !== 'No such Syndicate') {
      await this.broadcaster.broadcast(embed, platform, syndicate, null, timeout);
    }
  }

  async sendSyndicates(newSyndicates, platform) {
    for (const {
      key, display, prefix, timeout, notifiable,
    } of syndicates) {
      if (notifiable) {
        const embed = new embeds.Syndicate(this.bot, newSyndicates, display, platform);
        const eKey = `${prefix || ''}${key}`;
        const deleteAfter = timeout || fromNow(newSyndicates[0].expiry);
        await this.checkAndSendSyndicate(embed, eKey, deleteAfter, platform);
      }
    }
  }

  async sendTweets(newTweets, platform) {
    await Promise.all(newTweets.map(t => this.broadcaster
      .broadcast(new embeds.Tweet(this.bot, t.tweets[0]), platform, t.id, null, 3600)));
  }

  async sendUpdates(newNews, platform) {
    await Promise.all(newNews.map((i) => {
      if (!(i.date && between(i.date, platform))) return false;
      return this.broadcaster.broadcast(new embeds.News(this.bot, [i], 'updates', platform), platform, 'updates');
    }));
  }

  async sendVallisCycle(newCycle, platform, cycleChange) {
    const minutesRemaining = cycleChange ? '' : `.${Math.round(fromNow(newCycle.expiry) / 60000)}`;
    const type = `solaris.${newCycle.isWarm ? 'warm' : 'cold'}${minutesRemaining}`;
    await this.broadcaster.broadcast(
      new embeds.Solaris(this.bot, newCycle),
      platform, type, null, fromNow(newCycle.expiry),
    );
  }
}

module.exports = Notifier;
