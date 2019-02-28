'use strict';

const fetch = require('node-fetch');
const Wikia = require('node-wikia');

const AlertEmbed = require('../embeds/AlertEmbed');
const Broadcaster = require('./Broadcaster');
const ConclaveChallengeEmbed = require('../embeds/ConclaveChallengeEmbed');
const DarvoEmbed = require('../embeds/DarvoEmbed');
const EnemyEmbed = require('../embeds/EnemyEmbed');
const EventEmbed = require('../embeds/EventEmbed');
const FissureEmbed = require('../embeds/FissureEmbed');
const InvasionEmbed = require('../embeds/InvasionEmbed');
const NewsEmbed = require('../embeds/NewsEmbed');
const SalesEmbed = require('../embeds/SalesEmbed');
const SortieEmbed = require('../embeds/SortieEmbed');
const TweetEmbed = require('../embeds/TweetEmbed');
const SyndicateEmbed = require('../embeds/SyndicateEmbed');
const VoidTraderEmbed = require('../embeds/VoidTraderEmbed');
const EarthCycleEmbed = require('../embeds/EarthCycleEmbed');
const SolarisEmbed = require('../embeds/SolarisEmbed');
const NightwaveEmbed = require('../embeds/NightwaveEmbed');

const { createGroupedArray, apiBase, apiCdnBase } = require('../CommonFunctions');

const warframe = new Wikia('warframe');

const syndicates = require('../resources/syndicates.json');
const I18n = require('../settings/I18n');

const i18ns = {};
require('../resources/locales.json').forEach((locale) => {
  i18ns[locale] = I18n.use(locale);
});


/**
 * Returns the number of milliseconds between now and a given date
 * @param   {string} d         The date from which the current time will be subtracted
 * @param   {function} [now] A function that returns the current UNIX time in milliseconds
 * @returns {number}
 */
function fromNow(d, now = Date.now) {
  return new Date(d).getTime() - now();
}

async function getThumbnailForItem(query, fWiki) {
  if (query && !fWiki) {
    const fq = query
      .replace(/\d*\s*((?:\w|\s)*)\s*(?:blueprint|receiver|stock|barrel|blade|gauntlet|upper limb|lower limb|string|guard|neuroptics|systems|chassis|link)?/ig, '$1')
      .trim().toLowerCase();
    const results = await fetch(`${apiBase}/items/search/${encodeURIComponent(fq)}`).then(data => data.json());
    if (results.length) {
      const url = `${apiCdnBase}img/${results[0].imageName}`;
      const getImg = await fetch(url);
      if (getImg.ok) {
        return url;
      }
    }
    const articles = await warframe.getSearchList({ query: fq, limit: 1 });
    const details = await warframe.getArticleDetails({ ids: articles.items.map(i => i.id) });
    const item = Object.values(details.items)[0];
    return item.thumbnail ? item.thumbnail.replace(/\/revision\/.*/, '') : undefined;
  }
  return undefined;
}

/**
 * Notifier for alerts, invasions, etc.
 */
class Notifier {
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
    this.logger.debug(`Shard ${this.bot.shardId} Notifier ready`);
  }

  /**
   * Start the notifier
   */
  async start() {
    for (const k of Object.keys(this.bot.worldStates)) {
      this.bot.worldStates[k].on('newData', async (platform, newData) => {
        this.logger.debug(`Processing new data for ${platform}`);
        await this.onNewData(platform, newData);
      });
    }
  }

  /**
   * Send notifications on new data from worldstate
   * @param  {string} platform Platform to be updated
   * @param  {json} newData  Updated data from the worldstate
   */
  async onNewData(platform, newData) {
    let notifiedIds = [];
    const ids = await this.getNotifiedIds(platform, this.bot.shardId);
    // Set up data to notify
    const acolytesToNotify = newData.persistentEnemies
      .filter(e => !ids.includes(e.pid));
    const alertsToNotify = newData.alerts
      .filter(a => !ids.includes(a.id) && !a.expired);
    const baroToNotify = newData.voidTrader && !ids.includes(newData.voidTrader.psId)
      ? newData.voidTrader : undefined;
    const conclaveToNotify = newData.conclaveChallenges
      .filter(cc => !ids.includes(cc.id) && !cc.expired && !cc.rootChallenge);
    const dailyDealsToNotify = newData.dailyDeals.filter(d => !ids.includes(d.id));
    const eventsToNotify = newData.events
      .filter(e => !ids.includes(e.id) && !e.expired);
    const invasionsToNotify = newData.invasions
      .filter(i => !ids.includes(i.id) && i.rewardTypes.length);
    const featuredDealsToNotify = newData.flashSales
      .filter(d => !ids.includes(d.id) && d.isFeatured);
    const fissuresToNotify = newData.fissures
      .filter(f => !ids.includes(f.id) && !f.expired);
    const newsToNotify = newData.news
      .filter(n => !ids.includes(n.id)
              && !n.primeAccess && !n.update && !n.stream && n.translations.en);
    const popularDealsToNotify = newData.flashSales
      .filter(d => !ids.includes(d.id) && d.isPopular);
    const primeAccessToNotify = newData.news
      .filter(n => !ids.includes(n.id) && n.primeAccess && !n.stream && n.translations.en);
    const sortieToNotify = newData.sortie && !ids.includes(newData.sortie.id)
        && !newData.sortie.expired ? newData.sortie : undefined;
    const syndicatesToNotify = newData.syndicateMissions.filter(m => !ids.includes(m.id));
    const updatesToNotify = newData.news
      .filter(n => !ids.includes(n.id) && n.update && !n.stream && n.translations.en);
    const streamsToNotify = newData.news
      .filter(n => !ids.includes(n.id) && n.stream && n.translations.en);
    const tweetsToNotify = newData.twitter
      ? newData.twitter.filter(t => !ids.includes(t.uniqueId)) : [];
    const cetusCycleChange = !ids.includes(newData.cetusCycle.id) && newData.cetusCycle.expiry;
    const earthCycleChange = !ids.includes(newData.earthCycle.id) && newData.earthCycle.expiry;
    const vallisCycleChange = !ids.includes(newData.vallisCycle.id) && newData.vallisCycle.expiry;
    const nightwave = newData.nightwave && newData.nightwave.id
      && !ids.includes(newData.nightwave.id) && newData.nightwave.active ? newData.nightwave : undefined;

    // Concat all notified ids
    notifiedIds = notifiedIds
      .concat(newData.alerts.map(a => a.id))
      .concat(newData.conclaveChallenges.map(c => c.id))
      .concat(newData.dailyDeals.map(d => d.id))
      .concat(newData.events.map(e => e.id))
      .concat(newData.fissures.map(f => f.id))
      .concat(newData.flashSales.map(d => d.id))
      .concat(newData.invasions.map(i => i.id))
      .concat(newData.news.map(n => n.id))
      .concat(newData.persistentEnemies.map(p => p.pid))
      .concat(newData.sortie ? [newData.sortie.id] : [])
      .concat(newData.syndicateMissions.map(m => m.id))
      .concat(newData.voidTrader ? [`${newData.voidTrader.id}${newData.voidTrader.inventory.length}`] : [])
      .concat([newData.cetusCycle.id])
      .concat([newData.earthCycle.id])
      .concat([newData.vallisCycle.id])
      .concat([newData.nightwave ? newData.nightwave.id : undefined])
      .concat(newData.twitter ? newData.twitter.map(t => t.uniqueId) : [])
      .filter(id => id);

    // Send all notifications
    await this.updateNotified(notifiedIds, platform);
    await this.sendAcolytes(acolytesToNotify, platform);
    if (baroToNotify) {
      this.sendBaro(baroToNotify, platform);
    }
    if (conclaveToNotify && conclaveToNotify.length > 0) {
      this.sendConclaveDailies(conclaveToNotify, platform);
      await this.sendConclaveWeeklies(conclaveToNotify, platform);
    }
    if (tweetsToNotify && tweetsToNotify.length > 0) {
      this.sendTweets(tweetsToNotify, platform);
    }
    this.sendDarvo(dailyDealsToNotify, platform);
    this.sendEvent(eventsToNotify, platform);
    this.sendFeaturedDeals(featuredDealsToNotify, platform);
    this.sendFissures(fissuresToNotify, platform);
    this.sendNews(newsToNotify, platform);
    this.sendStreams(streamsToNotify, platform);
    this.sendPopularDeals(popularDealsToNotify, platform);
    this.sendPrimeAccess(primeAccessToNotify, platform);
    this.sendInvasions(invasionsToNotify, platform);
    if (sortieToNotify) {
      await this.sendSortie(sortieToNotify, platform);
    }
    if (syndicatesToNotify && syndicatesToNotify.length > 0) {
      await this.sendSyndicates(syndicatesToNotify, platform);
    }
    const ostron = newData.syndicateMissions.filter(mission => mission.syndicate === 'Ostrons')[0];
    if (ostron) {
      // eslint-disable-next-line no-param-reassign
      newData.cetusCycle.bountyExpiry = ostron.expiry;
    }
    await this.sendCetusCycle(newData.cetusCycle, platform, cetusCycleChange);
    await this.sendEarthCycle(newData.earthCycle, platform, earthCycleChange);

    await this.sendVallisCycle(newData.vallisCycle, platform, vallisCycleChange);
    this.sendUpdates(updatesToNotify, platform);
    await this.sendAlerts(alertsToNotify, platform);
    await this.sendNightwave(nightwave, platform);
  }

  /**
   * Get the list of notified ids
   * @param  {string} platform Platform to get notified ids for
   * @returns {Array}
   */
  async getNotifiedIds(platform) {
    return this.bot.settings.getNotifiedIds(platform, this.bot.shardId);
  }

  /**
   * Set the notified ids for a given platform and shard id
   * @param {JSON} ids list of oids that have been notifiedIds
   * @param {string} platform    platform corresponding to notified ids
   */
  async updateNotified(ids, platform) {
    await this.settings.setNotifiedIds(platform, this.bot.shardId, ids);
  }

  async sendAcolytes(newAcolytes, platform) {
    await Promise.all(newAcolytes.map(async a => this.broadcaster.broadcast(new EnemyEmbed(
      this.bot,
      [a], platform,
    ), platform, `enemies${a.isDiscovered ? '' : '.departed'}`, null, 3600000)));
  }

  async sendNightwave(nightwave, platform) {
    if (!nightwave) return;
    Object.entries(i18ns).forEach(async ([locale, i18n]) => {
      const embed = new NightwaveEmbed(this.bot, nightwave, platform, i18n);
      embed.locale = locale;
      // Broadcast even if the thumbnail fails to fetch
      await this.broadcaster.broadcast(embed, platform, 'nightwave', null, fromNow(nightwave.expiry));
    });
  }

  async sendAlerts(newAlerts, platform) {
    await Promise.all(newAlerts.map(async a => this.sendAlert(a, platform)));
  }

  async sendAlert(a, platform) {
    Object.entries(i18ns).forEach(async ([locale, i18n]) => {
      const embed = new AlertEmbed(this.bot, [a], platform, i18n);
      embed.locale = locale;
      try {
        const thumb = await getThumbnailForItem(a.mission.reward.itemString);
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
    const embed = new VoidTraderEmbed(this.bot, newBaro, platform);
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

  async sendConclaveDailies(newDailies, platform) {
    if (newDailies.filter(challenge => challenge.category === 'day').length > 0) {
      const embed = new ConclaveChallengeEmbed(this.bot, newDailies, 'day', platform);
      await this.broadcaster.broadcast(embed, platform, 'conclave.dailies', null, fromNow(newDailies[0].expiry));
    }
  }

  async sendConclaveWeeklies(newWeeklies, platform) {
    if (newWeeklies.filter(challenge => challenge.category === 'week').length > 0) {
      const embed = new ConclaveChallengeEmbed(this.bot, newWeeklies, 'week', platform);
      await this.broadcaster.broadcast(embed, platform, 'conclave.weeklies', null, fromNow(newWeeklies[0].expiry));
    }
  }

  async sendDarvo(newDarvoDeals, platform) {
    await Promise.all(newDarvoDeals.map(d => this.broadcaster.broadcast(new DarvoEmbed(this.bot, d, platform), platform, 'darvo', null, fromNow(d.expiry))));
  }

  async sendEvent(newEvents, platform) {
    await Promise.all(newEvents.map(e => this.broadcaster.broadcast(new EventEmbed(this.bot, e, platform), platform, 'operations', null, fromNow(e.expiry))));
  }

  async sendFeaturedDeals(newFeaturedDeals, platform) {
    await Promise.all(newFeaturedDeals.map(d => this.broadcaster.broadcast(new SalesEmbed(this.bot, [d], platform), platform, 'deals.featured', null, fromNow(d.expiry))));
  }

  async sendFissures(newFissures, platform) {
    await Promise.all(newFissures
      .map(f => this.broadcaster.broadcast(
        new FissureEmbed(this.bot, [f], platform), platform,
        `fissures.t${f.tierNum}.${f.missionType.toLowerCase()}`, null, fromNow(f.expiry),
      )));
  }

  async sendInvasions(newInvasions, platform) {
    await Promise.all(newInvasions.map(invasion => this.sendInvasion(invasion, platform)));
  }

  async sendTweets(newTweets, platform) {
    await Promise.all(newTweets.map(t => this.broadcaster
      .broadcast(new TweetEmbed(this.bot, t.tweets[0]), platform, t.id, null, 3600)));
  }

  async sendInvasion(invasion, platform) {
    Object.entries(i18ns).forEach(async ([locale, i18n]) => {
      const embed = new InvasionEmbed(this.bot, [invasion], platform, i18n);
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
        await this.broadcaster.broadcast(embed, platform, 'invasions', invasion.rewardTypes, 86400000);
      }
    });
  }

  async sendNews(newNews, platform) {
    await Promise.all(newNews.map(i => this.broadcaster.broadcast(new NewsEmbed(this.bot, [i], undefined, platform), platform, 'news')));
  }

  async sendStreams(newStreams, platform) {
    await Promise.all(newStreams.map(i => this.broadcaster.broadcast(new NewsEmbed(this.bot, [i], undefined, platform), platform, 'streams')));
  }

  async sendPopularDeals(newPopularDeals, platform) {
    await Promise.all(newPopularDeals.map(d => this.broadcaster.broadcast(new SalesEmbed(this.bot, [d], platform), platform, 'deals.popular', null, 86400000)));
  }

  async sendPrimeAccess(newNews, platform) {
    await Promise.all(newNews.map(i => this.broadcaster.broadcast(new NewsEmbed(this.bot, [i], 'primeaccess', platform), platform, 'primeaccess')));
  }

  async sendUpdates(newNews, platform) {
    await Promise.all(newNews.map(i => this.broadcaster.broadcast(new NewsEmbed(this.bot, [i], 'updates', platform), platform, 'updates')));
  }

  async sendSortie(newSortie, platform) {
    const embed = new SortieEmbed(this.bot, newSortie, platform);
    try {
      const thumb = await getThumbnailForItem(newSortie.boss, true);
      if (thumb) {
        embed.thumbnail.url = thumb;
      }
    } catch (e) {
      this.logger.error(`${e}`);
    } finally {
      await this.broadcaster.broadcast(embed, platform, 'sorties', null, fromNow(newSortie.expiry));
    }
  }

  async checkAndSendSyndicate(embed, syndicate, timeout, platform) {
    if (embed.description && embed.description.length > 0 && embed.description !== 'No such Syndicate') {
      await this.broadcaster.broadcast(embed, platform, syndicate, null, timeout);
    }
  }

  async sendSyndicates(newSyndicates, platform) {
    for (const {
      key, display, prefix, timeout,
    } of syndicates) {
      const embed = new SyndicateEmbed(this.bot, newSyndicates, display, platform);
      await this.checkAndSendSyndicate(embed, `${prefix ? 'syndicate.' : ''}${key}`, timeout || fromNow(newSyndicates[0].expiry), platform);
    }
  }

  async sendCetusCycle(newCetusCycle, platform, cetusCycleChange) {
    const minutesRemaining = cetusCycleChange ? '' : `.${Math.round(fromNow(newCetusCycle.expiry) / 60000)}`;
    const type = `cetus.${newCetusCycle.isDay ? 'day' : 'night'}${minutesRemaining}`;
    await this.broadcaster.broadcast(
      new EarthCycleEmbed(this.bot, newCetusCycle),
      platform, type, null, fromNow(newCetusCycle.expiry),
    );
  }

  async sendEarthCycle(newEarthCycle, platform, cetusCycleChange) {
    const minutesRemaining = cetusCycleChange ? '' : `.${Math.round(fromNow(newEarthCycle.expiry) / 60000)}`;
    const type = `earth.${newEarthCycle.isDay ? 'day' : 'night'}${minutesRemaining}`;
    await this.broadcaster.broadcast(
      new EarthCycleEmbed(this.bot, newEarthCycle),
      platform, type, null, fromNow(newEarthCycle.expiry),
    );
  }

  async sendVallisCycle(newCycle, platform, cycleChange) {
    const minutesRemaining = cycleChange ? '' : `.${Math.round(fromNow(newCycle.expiry) / 60000)}`;
    const type = `solaris.${newCycle.isWarm ? 'warm' : 'cold'}${minutesRemaining}`;
    await this.broadcaster.broadcast(
      new SolarisEmbed(this.bot, newCycle),
      platform, type, null, fromNow(newCycle.expiry),
    );
  }
}

module.exports = Notifier;
