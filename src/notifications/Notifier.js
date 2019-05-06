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
const KuvaEmbed = require('../embeds/KuvaEmbed');
const ArbitrationEmbed = require('../embeds/ArbitrationEmbed');

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
      settings: bot.settings,
      messageManager: bot.messageManager,
      logger: bot.logger,
    });

    this.socket = bot.socket;
    this.logger.debug(`Shard ${this.bot.shardId} Notifier ready`);
  }

  /**
   * Start the notifier
   */
  async start() {
    this.socket.on('tweet', async (tweet) => {
      if (tweet) {
        this.logger.debug(`received a ${tweet.id}`);
        platforms.forEach((platform) => {
          this.sendTweets(tweet, { eventKey: tweet.id, platform });
        });
      }
    });

    this.socket.on('ws', async ({
      event: type, platform, language = 'en', eventKey, data,
    }) => {
      const locale = Object.keys(i18ns).find(key => key.startsWith(language));
      const i18n = i18ns[locale] || i18ns.en;
      const deps = {
        platform, language, eventKey, locale, i18n,
      };
      this.determineTarget(type).forEach((call) => {
        call.bind(this)(data, deps);
      });
      if (!type.includes('Cycle')) {
        this.logger.debug(`received a ${eventKey} : ${type} : ${language} : ${platform}`);
      }
    });
  }

  determineTarget(type) {
    const targets = [];
    switch (type) {
      case 'alerts':
        targets.push(this.sendAlert);
        break;
      case 'arbitration':
        targets.push(this.sendArbitration);
        break;
      case 'cetusCycle':
        targets.push(this.sendCetusCycle);
        break;
      case 'conclaveChallenges':
        targets.push(this.sendConclaveDailies, this.sendConclaveWeeklies);
        break;
      case 'dailyDeals':
        targets.push(this.sendDarvo);
        break;
      case 'earthCycle':
        targets.push(this.sendEarthCycle);
        break;
      case 'events':
        targets.push(this.sendEvent);
        break;
      case 'fissures':
        targets.push(this.sendFissure);
        break;
      case 'flashSales':
        targets.push(this.sendFeaturedDeal, this.sendPopularDeal);
        break;
      case 'invasions':
        targets.push(this.sendInvasion);
        break;
      case 'kuva':
        targets.push(this.sendKuva);
        break;
      case 'news':
        targets.push(this.sendNews, this.sendStreams, this.sendPrimeAccess);
        break;
      case 'nightwave':
        targets.push(this.sendNightwave);
        break;
      case 'persistentEnemies':
        targets.push(this.sendAcolytes);
        break;
      case 'sortie':
        targets.push(this.sendSortie);
        break;
      case 'syndicateMissions':
        targets.push(this.sendSyndicates);
        break;
      case 'vallisCycle':
        targets.push(this.sendVallisCycle);
        break;
      case 'voidTrader':
        targets.push(this.sendBaro);
        break;

      default:
        break;
    }
    return targets;
  }

  async sendAcolytes(newAcolyte, { platform, language }) {
    const embed = new EnemyEmbed(this.bot, [newAcolyte], platform);
    const type = `enemies${newAcolyte.isDiscovered ? '' : '.departed'}`;
    this.broadcaster.broadcast(embed, type, { platform, language });
  }

  async sendAlert(a, { platform, language }) {
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
        await this.broadcaster.broadcast(embed, 'alerts', { items: a.rewardTypes, platform, language });
      }
    });
  }

  async sendArbitration(arbitration, {
    platform, language, i18n, locale, eventKey,
  }) {
    const embed = new ArbitrationEmbed(this.bot, arbitration, platform, i18n);
    embed.locale = locale;
    this.broadcaster.broadcast(embed, eventKey, { platform, language });
  }

  async sendBaro(newBaro, { platform, language }) {
    const embed = new VoidTraderEmbed(this.bot, newBaro, platform);
    if (embed.fields.length > 25) {
      const fields = createGroupedArray(embed.fields, 15);
      fields.forEach(async (fieldGroup) => {
        const tembed = Object.assign({}, embed);
        tembed.fields = fieldGroup;
        await this.broadcaster.broadcast(tembed, 'baro', { platform, language });
      });
    } else {
      await this.broadcaster.broadcast(embed, 'baro', { platform, language });
    }
  }

  async sendCetusCycle(newCetusCycle, { platform, language, eventKey }) {
    const embed = new SolarisEmbed(this.bot, newCetusCycle);
    await this.broadcaster.broadcast(embed, eventKey, { platform, language });
  }

  async sendConclaveDailies(newDailies, { platform, language }) {
    if ([newDailies].filter(challenge => challenge.category === 'day').length > 0) {
      const embed = new ConclaveChallengeEmbed(this.bot, [newDailies], 'day', platform);
      await this.broadcaster.broadcast(embed, 'conclave.dailies', { platform, language });
    }
  }

  async sendConclaveWeeklies(newWeeklies, { platform, language }) {
    if ([newWeeklies].filter(challenge => challenge.category === 'week').length > 0) {
      const embed = new ConclaveChallengeEmbed(this.bot, [newWeeklies], 'week', platform);
      await this.broadcaster.broadcast(embed, 'conclave.weeklies', { platform, language });
    }
  }

  async sendDarvo(deal, { platform, language, eventKey }) {
    const embed = new DarvoEmbed(this.bot, deal, platform);
    this.broadcaster.broadcast(embed, eventKey, { platform, language });
  }

  async sendEarthCycle(newCycle, { platform, language, eventKey }) {
    const embed = new EarthCycleEmbed(this.bot, newCycle);
    await this.broadcaster.broadcast(embed, eventKey, { platform, language });
  }

  async sendEvent(event, { platform, language }) {
    const embed = new EventEmbed(this.bot, event, platform);
    this.broadcaster.broadcast(embed, 'operations', { platform, language });
  }

  async sendFeaturedDeal(deal, { platform, language }) {
    if (deal.isFeatured) {
      this.broadcaster.broadcast(new SalesEmbed(this.bot, [deal], platform), 'deals.featured', { platform, language });
    }
  }

  async sendFissure(fissure, {
    platform, language, locale, i18n, eventKey,
  }) {
    const embed = new FissureEmbed(this.bot, [fissure], platform, i18n);
    embed.locale = locale;
    this.broadcaster.broadcast(embed, eventKey, { platform, language });
  }

  async sendInvasion(invasion, {
    platform, eventKey, locale, i18n, language,
  }) {
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
      await this.broadcaster.broadcast(embed, eventKey,
        { platform, items: invasion.rewardTypes, language });
    }
  }

  async sendKuva(kuva, {
    platform, eventKey, locale, i18n, language,
  }) {
    const embed = new KuvaEmbed(this.bot, kuva, platform, i18n);
    embed.locale = locale;

    this.broadcaster.broadcast(embed, eventKey, { platform, language });
  }

  async sendNews(news, { platform, language, eventKey }) {
    if (!(news.primeAccess || news.update || news.stream) && news.translations[language]) {
      const embed = new NewsEmbed(this.bot, [news], undefined, platform);
      this.broadcaster.broadcast(embed, eventKey, { platform, language });
    }
  }

  async sendNightwave(nightwave, {
    platform, language, eventKey, i18n, locale,
  }) {
    if (!nightwave) return;
    const embed = new NightwaveEmbed(this.bot, nightwave, platform, i18n);
    embed.locale = locale;
    await this.broadcaster.broadcast(embed, eventKey, { language, platform });
  }

  async sendStreams(news, { platform, language }) {
    if (news.stream && news.translations[language]) {
      const embed = new NewsEmbed(this.bot, [news], 'updates', platform);
      this.broadcaster.broadcast(embed, 'updates', { platform, language });
    }
  }

  async sendPopularDeal(deal, { platform, language }) {
    if (deal.isPopular) {
      this.broadcaster.broadcast(new SalesEmbed(this.bot, [deal], platform), 'deals.popular', { platform, language });
    }
  }

  async sendPrimeAccess(news, { platform, language }) {
    if (news.primeAccess && news.translations[language]) {
      const embed = new NewsEmbed(this.bot, [news], 'primeaccess', platform);
      this.broadcaster.broadcast(embed, 'primeaccess', { platform, language });
    }
  }

  async sendUpdates(news, { platform, language }) {
    if (news.primeAccess && news.translations[language]) {
      const embed = new NewsEmbed(this.bot, [news], 'updates', platform);
      this.broadcaster.broadcast(embed, 'updates', { platform, language });
    }
  }

  async sendSortie(newSortie, { platform, language }) {
    const embed = new SortieEmbed(this.bot, newSortie, platform);
    try {
      const thumb = await getThumbnailForItem(newSortie.boss, true);
      if (thumb) {
        embed.thumbnail.url = thumb;
      }
    } catch (e) {
      this.logger.error(`${e}`);
    } finally {
      await this.broadcaster.broadcast(embed, 'sorties', { platform, language });
    }
  }

  async checkAndSendSyndicate(embed, syndicate, { platform, language }) {
    if (embed.description && embed.description.length > 0 && embed.description !== 'No such Syndicate') {
      await this.broadcaster.broadcast(embed, syndicate, { platform, language });
    }
  }

  async sendSyndicates(newSyndicate, { platform, language }) {
    for (const {
      key, display, prefix, notifiable,
    } of syndicates) {
      if (notifiable) {
        const embed = new SyndicateEmbed(this.bot, [newSyndicate], display, platform);
        const eventKey = `${prefix ? 'syndicate.' : ''}${key}`;
        await this.checkAndSendSyndicate(embed, eventKey, { platform, language });
      }
    }
  }

  async sendTweets(tweet, { platform, language, eventKey }) {
    this.broadcaster
      .broadcast(new TweetEmbed(this.bot, tweet), eventKey, { platform, language });
  }

  async sendVallisCycle(newCycle, { platform, language, eventKey }) {
    const embed = new SolarisEmbed(this.bot, newCycle);
    await this.broadcaster.broadcast(embed, eventKey.replace('vallis', 'solaris'), { platform, language });
  }
}

module.exports = Notifier;
