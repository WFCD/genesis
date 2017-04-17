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
  start() {
    Object.keys(this.bot.worldStates).forEach((k) => {
      this.bot.worldStates[k].on('newData', (platform, newData, oldData) =>
        this.onNewData(platform, newData, oldData));
    });
  }

  /**
   * Send notifications on new data from worldstate
   * @param  {string} platform Platform to be updated
   * @param  {json} newData  Updated data from the worldstate
   */
  onNewData(platform, newData) {
    let notifiedIds = [];

    this.getNotifiedIds(platform).then((ids) => {
      // Set up data to notify
      const acolytesToNotify = newData.persistentEnemies
        .filter(e => !ids.includes(e.id) && e.isDiscovered);
      const alertsToNotify = newData.alerts
        .filter(a => !ids.includes(a.id) && a.getRewardTypes().length && !a.getExpired());
      const baroToNotify = newData.voidTrader && !ids.includes(newData.voidTrader.id) ?
        newData.voidTrader : undefined;
      const conclaveToNotify = newData.conclaveChallenges.filter(cc =>
        !ids.includes(cc.id) && !cc.inExpired && !cc.isRootChallenge());
      const dailyDealsToNotify = newData.dailyDeals.filter(d => !ids.includes(d.id));
      const eventsToNotify = newData.events
        .filter(e => !ids.includes(e.id) && !e.getExpired());
      const invasionsToNotify = newData.invasions
        .filter(i => !ids.includes(i.id) && i.getRewardTypes().length);
      const featuredDealsToNotify = newData.flashSales
        .filter(d => !ids.includes(d.id) && d.isFeatured);
      const fissuresToNotify = newData.fissures
        .filter(f => !ids.includes(f.id) && !f.getExpired());
      const newsToNotify = newData.news
        .filter(n => !ids.includes(n.id) && !n.isPrimeAccess() && !n.isUpdate());
      const popularDealsToNotify = newData.flashSales
        .filter(d => !ids.includes(d.id) && d.isPopular);
      const primeAccessToNotify = newData.news
          .filter(n => !ids.includes(n.id) && n.isPrimeAccess());
      const sortieToNotify = newData.sortie && !ids.includes(newData.sortie.id)
        && !newData.sortie.isExpired() ? newData.sortie : undefined;
      const syndicateToNotify = newData.syndicateMissions.filter(m => !ids.includes(m.id));
      const updatesToNotify = newData.news
        .filter(n => !ids.includes(n.id) && n.isUpdate());
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
                    .concat(newData.voidTrader ? [newData.voidTrader.id] : []);

      // Send all notifications
      return this.updateNotified(notifiedIds, platform)
        .then(() => this.sendAcolytes(acolytesToNotify, platform))
        .then(() => this.sendAlerts(alertsToNotify, platform))
        .then(() => {
          if (baroToNotify) {
            this.sendBaro(baroToNotify, platform);
          }
          return true;
        })
        .then(() => {
          if (conclaveToNotify && conclaveToNotify.length > 0) {
            return this.sendConclaveDailies(conclaveToNotify, platform)
              .then(() => this.sendConclaveWeeklies(conclaveToNotify, platform));
          }
          return true;
        })
        .then(() => this.sendDarvo(dailyDealsToNotify, platform))
        .then(() => this.sendEvent(eventsToNotify, platform))
        .then(() => this.sendFeaturedDeals(featuredDealsToNotify, platform))
        .then(() => this.sendFissures(fissuresToNotify, platform))
        .then(() => this.sendNews(newsToNotify, platform))
        .then(() => this.sendPopularDeals(popularDealsToNotify, platform))
        .then(() => this.sendPrimeAccess(primeAccessToNotify, platform))
        .then(() => this.sendInvasions(invasionsToNotify, platform))
        .then(() => {
          if (sortieToNotify) {
            return this.sendSortie(sortieToNotify, platform);
          }
          return true;
        })
        .then(() => {
          if (syndicateToNotify && syndicateToNotify.length > 0) {
            return this.sendSyndicateArbiters(syndicateToNotify, platform)
              .then(() => this.sendSyndicatePerrin(syndicateToNotify, platform))
              .then(() => this.sendSyndicateSuda(syndicateToNotify, platform))
              .then(() => this.sendSyndicateMeridian(syndicateToNotify, platform))
              .then(() => this.sendSyndicateLoka(syndicateToNotify, platform))
              .then(() => this.sendSyndicateVeil(syndicateToNotify, platform));
          }
          return true;
        })
        .then(() => this.sendUpdates(updatesToNotify, platform));
    }).catch(this.logger.error);
  }

  /**
  * Braodcast embed to all channels for a platform and type
   * @param  {Object} embed      Embed to send to a channel
   * @param  {string} platform   Platform of worldstate
   * @param  {string} type       Type of new data to notify
   * @param  {Array}  [items=[]] Items to broadcast
   * @returns {Promise}
   */
  broadcast(embed, platform, type, items = []) {
    return this.bot.settings.getNotifications(type, platform, items)
    .then(channels => Promise.map(channels, channelResults =>
      channelResults.forEach((result) => {
        const channel = this.client.channels.get(result.channelId);
        if (channel) {
          if (channel.type === 'text') {
            return this.settings.getPing(channel.guild, (items || []).concat([type]))
              .then(prepend => this.bot.messageManager.embedToChannel(channel, embed, prepend));
          } else if (channel.type === 'dm') {
            return this.bot.messageManager.embedToChannel(channel, embed, '');
          }
        }
        return null;
      })));
  }

  /**
   * Get the list of notified ids
   * @param  {string} platform Platform to get notified ids for
   * @returns {Promise.<Array>}
   */
  getNotifiedIds(platform) {
    return this.settings.getNotifiedIds(platform, this.bot.shardId);
  }

  /**
   * Set the notified ids for a given platform and shard id
   * @param {JSON} ids list of oids that have been notifiedIds
   * @param {string} platform    platform corresponding to notified ids
   * @returns {Promise}
   */
  updateNotified(ids, platform) {
    return this.settings.setNotifiedIds(platform, this.bot.shardId, ids)
      .catch(this.logger.error);
  }

  sendAcolytes(newAcolytes, platform) {
    return Promise.map(newAcolytes, (a) => {
      const embed = new EnemyEmbed(this.bot, [a]);
      return this.broadcast(embed, platform, 'enemies', null);
    });
  }

  sendAlerts(newAlerts, platform) {
    return Promise.map(newAlerts, (a) => {
      const embed = new AlertEmbed(this.bot, [a]);
      return warframe.getSearchList({
        query: a.getReward().toString().replace(/\s*\+\s*\d*cr/ig, '').replace(/^1\s/, ''),
        limit: 1,
      }).then(articles => warframe.getArticleDetails({
        ids: articles.items.map(i => i.id),
      })).then((details) => {
        const item = Object.values(details.items)[0];
        const thumb = item.thumbnail ? item.thumbnail.replace(/\/revision\/.*/, '') : undefined;
        if (thumb) {
          embed.thumbnail.url = thumb;
        }
        return this.broadcast(embed, platform, 'alerts', a.getRewardTypes());
      })
      .catch(() => this.broadcast(embed, platform, 'alerts', a.getRewardTypes()));
    });
  }

  sendBaro(newBaro, platform) {
    const embed = new VoidTraderEmbed(this.bot, newBaro);
    return this.broadcast(embed, platform, 'baro', null);
  }

  sendConclaveDailies(newDailies, platform) {
    const embed = new ConclaveChallengeEmbed(this.bot, newDailies, 'day');
    return this.broadcast(embed, platform, 'conclave.dailies', null);
  }

  sendConclaveWeeklies(newDailies, platform) {
    const embed = new ConclaveChallengeEmbed(this.bot, newDailies, 'week');
    return this.broadcast(embed, platform, 'conclave.weeklies', null);
  }

  sendDarvo(newDarvoDeals, platform) {
    return Promise.map(newDarvoDeals, (d) => {
      const embed = new DarvoEmbed(this.bot, d);
      return this.broadcast(embed, platform, 'darvo', null);
    });
  }

  sendEvent(newEvents, platform) {
    return Promise.map(newEvents, (e) => {
      const embed = new EventEmbed(this.bot, [e]);
      return this.broadcast(embed, platform, 'events', null);
    });
  }

  sendFeaturedDeals(newFeaturedDeals, platform) {
    return Promise.map(newFeaturedDeals, (d) => {
      const embed = new SalesEmbed(this.bot, [d]);
      return this.broadcast(embed, platform, 'deals.featured', null);
    });
  }

  sendFissures(newFissures, platform) {
    return Promise.map(newFissures, (f) => {
      const embed = new FissureEmbed(this.bot, [f]);
      return this.broadcast(embed, platform, `fissures.t${f.tierNum}`, null);
    });
  }

  sendInvasions(newInvasions, platform) {
    return Promise.map(newInvasions, (invasion) => {
      const embed = new InvasionEmbed(this.bot, [invasion]);
      return warframe.getSearchList({
        query: invasion.attackerReward.toString().replace(/\s*\+\s*\d*cr/ig, '').replace(/^1\s/, ''),
        limit: 1,
      }).then(articles => warframe.getArticleDetails({
        ids: articles.items.map(i => i.id),
      })).then((details) => {
        const item = Object.values(details.items)[0];
        const thumb = item.thumbnail ? item.thumbnail.replace(/\/revision\/.*/, '') : undefined;
        if (thumb) {
          embed.thumbnail.url = thumb;
        }
        return this.broadcast(embed, platform, 'invasions', invasion.getRewardTypes());
      })
      .catch(() => this.broadcast(embed, platform, 'invasions', invasion.getRewardTypes()));
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
      return this.broadcast(embed, platform, 'deals.popular', null);
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
      return this.broadcast(embed, platform, 'sorties', null);
    })
    .catch(() => this.broadcast(embed, platform, 'sorties', null));
  }

  sendSyndicateArbiters(newSyndicates, platform) {
    const embed = new SyndicateEmbed(this.bot, newSyndicates, 'Arbiters of Hexis');
    return this.broadcast(embed, platform, 'syndicate.arbiters', null);
  }

  sendSyndicateLoka(newSyndicates, platform) {
    const embed = new SyndicateEmbed(this.bot, newSyndicates, 'New Loka');
    return this.broadcast(embed, platform, 'syndicate.loka', null);
  }

  sendSyndicateMeridian(newSyndicates, platform) {
    const embed = new SyndicateEmbed(this.bot, newSyndicates, 'Steel Meridian');
    return this.broadcast(embed, platform, 'syndicate.meridian', null);
  }

  sendSyndicatePerrin(newSyndicates, platform) {
    const embed = new SyndicateEmbed(this.bot, newSyndicates, 'Perrin Sequence');
    return this.broadcast(embed, platform, 'syndicate.perin', null);
  }

  sendSyndicateSuda(newSyndicates, platform) {
    const embed = new SyndicateEmbed(this.bot, newSyndicates, 'Cephalon Suda');
    return this.broadcast(embed, platform, 'syndicate.suda', null);
  }

  sendSyndicateVeil(newSyndicates, platform) {
    const embed = new SyndicateEmbed(this.bot, newSyndicates, 'Red Veil');
    return this.broadcast(embed, platform, 'syndicate.veil', null);
  }
}

module.exports = Notifier;
