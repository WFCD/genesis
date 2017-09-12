'use strict';

const Wikia = require('node-wikia');

const Promise = require('bluebird');
const AlertEmbed = require('../embeds/AlertEmbed.js');
const ConclaveChallengeEmbed = require('../embeds/ConclaveChallengeEmbed.js');
const DarvoEmbed = require('../embeds/DarvoEmbed.js');
const EnemyEmbed = require('../embeds/EnemyEmbed.js');
const EventEmbed = require('../embeds/EventEmbed.js');
const FissureEmbed = require('../embeds/FissureEmbed.js');
const InvasionEmbed = require('../embeds/InvasionEmbed.js');
const NewsEmbed = require('../embeds/NewsEmbed.js');
const SalesEmbed = require('../embeds/SalesEmbed.js');
const SortieEmbed = require('../embeds/SortieEmbed.js');
const SyndicateEmbed = require('../embeds/SyndicateEmbed.js');
const VoidTraderEmbed = require('../embeds/VoidTraderEmbed.js');

const warframe = new Wikia('warframe');

/**
 * Returns the number of milliseconds between now and a given date
 * @param   {string} d         The date from which the current time will be subtracted
 * @param   {function} [now] A function that returns the current UNIX time in milliseconds
 * @returns {number}
 */
function fromNow(d, now = Date.now) {
  return new Date(d).getTime() - now();
}

/**
 * Notifier for alerts, invasions, etc.
 */
class Notifier {
  constructor(bot) {
    this.bot = bot;
    this.logger = bot.logger;
    this.ids = {};
    this.messageManager = bot.MessageManager;
    this.settings = bot.settings;
    this.client = bot.client;
  }

  /**
   * Start the notifier
   */
  async start() {
    for (const k of Object.keys(this.bot.worldStates)) {
      this.bot.worldStates[k].on('newData', this.onNewData);
    }
  }

  /**
   * Send notifications on new data from worldstate
   * @param  {string} platform Platform to be updated
   * @param  {json} newData  Updated data from the worldstate
   */
  async onNewData(platform, newData) {
    let notifiedIds = [];
    const ids = await this.getNotifiedIds(platform);
    // Set up data to notify
    const acolytesToNotify = newData.persistentEnemies
      .filter(e => !ids.includes(e.id) && e.isDiscovered);
    const alertsToNotify = newData.alerts
      .filter(a => !ids.includes(a.id) && a.rewardTypes.length && !a.expired);
    const baroToNotify = newData.voidTrader && !ids.includes(newData.voidTrader.psId) ?
      newData.voidTrader : undefined;
    const conclaveToNotify = newData.conclaveChallenges.filter(cc =>
      !ids.includes(cc.id) && !cc.expired && !cc.rootChallenge);
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
      .filter(n => !ids.includes(n.id) && !n.primeAccess && !n.update);
    const popularDealsToNotify = newData.flashSales
      .filter(d => !ids.includes(d.id) && d.isPopular);
    const primeAccessToNotify = newData.news
        .filter(n => !ids.includes(n.id) && n.primeAccess);
    const sortieToNotify = newData.sortie && !ids.includes(newData.sortie.id)
      && !newData.sortie.expired ? newData.sortie : undefined;
    const syndicateToNotify = newData.syndicateMissions.filter(m => !ids.includes(m.id));
    const updatesToNotify = newData.news
      .filter(n => !ids.includes(n.id) && n.update);
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
                  .concat(newData.persistentEnemies.map(p => p.id))
                  .concat(newData.sortie ? [newData.sortie.id] : [])
                  .concat(newData.syndicateMissions.map(m => m.id))
                  .concat(newData.voidTrader ? [`${newData.voidTrader.id}${newData.voidTrader.inventory.length}`] : []);

    // Send all notifications
    await this.updateNotified(notifiedIds, platform);
    await this.sendAcolytes(acolytesToNotify, platform);
    await this.sendAlerts(alertsToNotify, platform);
    if (baroToNotify) {
      await this.sendBaro(baroToNotify, platform);
    }
    if (conclaveToNotify && conclaveToNotify.length > 0) {
      await this.sendConclaveDailies(conclaveToNotify, platform);
      await this.sendConclaveWeeklies(conclaveToNotify, platform);
    }
    await this.sendDarvo(dailyDealsToNotify, platform);
    await this.sendEvent(eventsToNotify, platform);
    await this.sendFeaturedDeals(featuredDealsToNotify, platform);
    await this.sendFissures(fissuresToNotify, platform);
    await this.sendNews(newsToNotify, platform);
    await this.sendPopularDeals(popularDealsToNotify, platform);
    await this.sendPrimeAccess(primeAccessToNotify, platform);
    await this.sendInvasions(invasionsToNotify, platform);
    if (sortieToNotify) {
      await this.sendSortie(sortieToNotify, platform);
    }
    if (syndicateToNotify && syndicateToNotify.length > 0) {
      await this.sendSyndicateArbiters(syndicateToNotify, platform);
      await this.sendSyndicatePerrin(syndicateToNotify, platform);
      await this.sendSyndicateSuda(syndicateToNotify, platform);
      await this.sendSyndicateMeridian(syndicateToNotify, platform);
      await this.sendSyndicateLoka(syndicateToNotify, platform);
      await this.sendSyndicateVeil(syndicateToNotify, platform);
    }
    await this.sendUpdates(updatesToNotify, platform);
  }

  /**
  * Braodcast embed to all channels for a platform and type
   * @param  {Object} embed      Embed to send to a channel
   * @param  {string} platform   Platform of worldstate
   * @param  {string} type       Type of new data to notify
   * @param  {Array}  [items=[]] Items to broadcast
   * @param {number} [deleteAfter=0] Amount of time to delete broadcast after
   */
  async broadcast(embed, platform, type, items = [], deleteAfter = 0) {
    const channels = await this.bot.settings.getNotifications(type, platform, items);
    for (const channelResults of channels) {
      for (const result of channelResults) {
        const channel = this.client.channels.get(result.channelId);
        if (channel) {
          if (channel.type === 'text') {
            const prepend = await this.settings
              .getPing(channel.guild, (items || []).concat([type]));
            this.bot.messageManager.embedToChannel(channel, embed, prepend, deleteAfter);
          } else if (channel.type === 'dm') {
            await this.bot.messageManager.embedToChannel(channel, embed, '', deleteAfter);
          }
        }
      }
    }
  }

  /**
   * Get the list of notified ids
   * @param  {string} platform Platform to get notified ids for
   * @returns {Array}
   */
  async getNotifiedIds(platform) {
    return await this.settings.getNotifiedIds(platform, this.bot.shardId);
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
    for (const a of newAcolytes) {
      const embed = new EnemyEmbed(this.bot, [a]);
      await this.broadcast(embed, platform, 'enemies', null, 3600000);
    }
  }

  async sendAlerts(newAlerts, platform) {
    for (const a of newAlerts) {
      const embed = new AlertEmbed(this.bot, [a]);
      try {
        const articles = await warframe.getSearchList({
          query: a.mission.reward.itemString,
          limit: 1,
        });
        const details = await warframe.getArticleDetails({ ids: articles.items.map(i => i.id) });
        const item = Object.values(details.items)[0];
        const thumb = item.thumbnail ? item.thumbnail.replace(/\/revision\/.*/, '') : undefined;
        if (thumb && !a.rewardTypes.includes('reactor') && !a.rewardTypes.includes('catalyst')) {
          embed.thumbnail.url = thumb;
        }
        await this.broadcast(embed, platform, 'alerts', a.rewardTypes, fromNow(a.expiry));
      } catch (e) {
        await this.broadcast(embed, platform, 'alerts', a.rewardTypes, fromNow(a.expiry));
      }
    }
  }

  sendBaro(newBaro, platform) {
    const embed = new VoidTraderEmbed(this.bot, newBaro);
    return this.broadcast(embed, platform, 'baro', null);
  }

  sendConclaveDailies(newDailies, platform) {
    if (newDailies.filter(challenge => challenge.category === 'day').length > 0) {
      const embed = new ConclaveChallengeEmbed(this.bot, newDailies, 'day');
      return this.broadcast(embed, platform, 'conclave.dailies', null, fromNow(newDailies[0].expiry));
    }
    return new Promise(resolve => resolve(true));
  }

  sendConclaveWeeklies(newWeeklies, platform) {
    if (newWeeklies.filter(challenge => challenge.category === 'week').length > 0) {
      const embed = new ConclaveChallengeEmbed(this.bot, newWeeklies, 'week');
      return this.broadcast(embed, platform, 'conclave.weeklies', null, fromNow(newWeeklies[0].expiry));
    }
    return new Promise(resolve => resolve(true));
  }

  sendDarvo(newDarvoDeals, platform) {
    return Promise.map(newDarvoDeals, (d) => {
      const embed = new DarvoEmbed(this.bot, d);
      return this.broadcast(embed, platform, 'darvo', null, fromNow(d.expiry));
    });
  }

  sendEvent(newEvents, platform) {
    return Promise.map(newEvents, (e) => {
      const embed = new EventEmbed(this.bot, [e]);
      return this.broadcast(embed, platform, 'events', null, fromNow(e.expiry));
    });
  }

  sendFeaturedDeals(newFeaturedDeals, platform) {
    return Promise.map(newFeaturedDeals, (d) => {
      const embed = new SalesEmbed(this.bot, [d]);
      return this.broadcast(embed, platform, 'deals.featured', null, fromNow(d.expiry));
    });
  }

  sendFissures(newFissures, platform) {
    return Promise.map(newFissures, (f) => {
      const embed = new FissureEmbed(this.bot, [f]);
      return this.broadcast(embed, platform, `fissures.t${f.tierNum}`, null, fromNow(f.expiry));
    });
  }

  sendInvasions(newInvasions, platform) {
    return Promise.map(newInvasions, (invasion) => {
      const embed = new InvasionEmbed(this.bot, [invasion]);
      return warframe.getSearchList({
        query: invasion.attackerReward.itemString,
        limit: 1,
      }).then(articles => warframe.getArticleDetails({
        ids: articles.items.map(i => i.id),
      })).then((details) => {
        const item = Object.values(details.items)[0];
        const thumb = item.thumbnail ? item.thumbnail.replace(/\/revision\/.*/, '') : undefined;
        if (thumb && !invasion.rewardTypes.includes('reactor') && !invasion.rewardTypes.includes('catalyst')) {
          embed.thumbnail.url = thumb;
        }
        return this.broadcast(embed, platform, 'invasions', invasion.rewardTypes, 86400000);
      })
      .catch(() => this.broadcast(embed, platform, 'invasions', invasion.rewardTypes, 86400000));
    });
  }

  sendNews(newNews, platform) {
    return Promise.map(newNews, (i) => {
      const embed = new NewsEmbed(this.bot, [i]);
      return this.broadcast(embed, platform, 'news');
    });
  }

  sendPopularDeals(newPopularDeals, platform) {
    return Promise.map(newPopularDeals, (d) => {
      const embed = new SalesEmbed(this.bot, [d]);
      return this.broadcast(embed, platform, 'deals.popular', null, 86400000);
    });
  }

  sendPrimeAccess(newNews, platform) {
    return Promise.map(newNews, (i) => {
      const embed = new NewsEmbed(this.bot, [i]);
      return this.broadcast(embed, platform, 'primeaccess', null);
    });
  }

  sendUpdates(newNews, platform) {
    return Promise.map(newNews, (i) => {
      const embed = new NewsEmbed(this.bot, [i]);
      return this.broadcast(embed, platform, 'updates', null);
    });
  }

  sendSortie(newSortie, platform) {
    const embed = new SortieEmbed(this.bot, newSortie);
    return warframe.getSearchList({
      query: newSortie.boss,
      limit: 1,
    }).then(articles => warframe.getArticleDetails({
      ids: articles.items.map(i => i.id),
    })).then((details) => {
      const item = Object.values(details.items)[0];
      const thumb = item.thumbnail ? item.thumbnail.replace(/\/revision\/.*/, '') : undefined;
      if (thumb) {
        embed.thumbnail.url = thumb;
      }
      return this.broadcast(embed, platform, 'sorties', null, fromNow(newSortie.expiry));
    })
    .catch(() => this.broadcast(embed, platform, 'sorties', null, fromNow(newSortie.expiry)));
  }

  sendSyndicateArbiters(newSyndicates, platform) {
    const embed = new SyndicateEmbed(this.bot, newSyndicates, 'Arbiters of Hexis');
    return this.broadcast(embed, platform, 'syndicate.arbiters', null, 86400000);
  }

  sendSyndicateLoka(newSyndicates, platform) {
    const embed = new SyndicateEmbed(this.bot, newSyndicates, 'New Loka');
    return this.broadcast(embed, platform, 'syndicate.loka', null, 86400000);
  }

  sendSyndicateMeridian(newSyndicates, platform) {
    const embed = new SyndicateEmbed(this.bot, newSyndicates, 'Steel Meridian');
    return this.broadcast(embed, platform, 'syndicate.meridian', null, 86400000);
  }

  sendSyndicatePerrin(newSyndicates, platform) {
    const embed = new SyndicateEmbed(this.bot, newSyndicates, 'Perrin Sequence');
    return this.broadcast(embed, platform, 'syndicate.perin', null, 86400000);
  }

  sendSyndicateSuda(newSyndicates, platform) {
    const embed = new SyndicateEmbed(this.bot, newSyndicates, 'Cephalon Suda');
    return this.broadcast(embed, platform, 'syndicate.suda', null, 86400000);
  }

  sendSyndicateVeil(newSyndicates, platform) {
    const embed = new SyndicateEmbed(this.bot, newSyndicates, 'Red Veil');
    return this.broadcast(embed, platform, 'syndicate.veil', null, 86400000);
  }
}

module.exports = Notifier;
