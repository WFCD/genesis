import Promise from 'bluebird';
import Broadcaster from '../Broadcaster.js';
import logger from '../../utilities/Logger.js';

import { asId, embeds, getThumbnailForItem, i18ns, perLanguage, updating } from '../NotifierUtils.js';
import { syndicates } from '../../resources/index.js';

import { captures, createGroupedArray, platforms } from '../../utilities/CommonFunctions.js';

const updtReg = new RegExp(captures.updates, 'i');
const beats = {};
const makeNightwaveType = (challenge) => {
  let type = 'daily';

  if (challenge.isElite) {
    type = 'elite';
  } else if (!challenge.isDaily) {
    type = 'weekly';
  }
  return `nightwave.${type}`;
};
const buildNotifiableData = (newData, notified) => {
  const data = {
    acolytes: newData.persistentEnemies.filter((e) => !notified.includes(e.pid)),
    alerts: newData.alerts.filter((a) => !a.expired && !notified.includes(a.id)),
    archonHunt:
      newData.archonHunt && !newData.archonHunt.expired && !notified.includes(newData.archonHunt.id)
        ? newData.archonHunt
        : undefined,
    baro:
      newData.voidTrader && !notified.includes(`${newData.voidTrader.id}${newData.voidTrader.active ? '1' : '0'}`)
        ? newData.voidTrader
        : undefined,
    conclave: newData.conclaveChallenges.filter((cc) => !cc.expired && !cc.rootChallenge && !notified.includes(cc.id)),
    dailyDeals: newData.dailyDeals.filter((dd) => !notified.includes(dd.id)),
    events: newData.events.filter((e) => !e.expired && !notified.includes(e.id)),
    invasions: newData.invasions.filter((i) => i.rewardTypes.length && !notified.includes(i.id)),
    featuredDeals: newData.flashSales.filter((d) => d.isFeatured && !notified.includes(d.id)),
    fissures: newData.fissures.filter((f) => f.active && !notified.includes(f.id)),
    news: newData.news.filter(
      (n) => !n.primeAccess && !n.update && !updtReg.test(n.message) && !n.stream && !notified.includes(n.id)
    ),
    popularDeals: newData.flashSales.filter((d) => d.isPopular && !notified.includes(d.id)),
    primeAccess: newData.news.filter((n) => n.primeAccess && !n.stream && !notified.includes(n.id)),
    sortie:
      newData.sortie && !newData.sortie.expired && !notified.includes(newData.sortie.id) ? newData.sortie : undefined,
    streams: newData.news.filter((n) => n.stream && !notified.includes(n.id)),
    steelPath:
      newData.steelPath.currentReward && !notified.includes(asId(newData.steelPath, 'steelpath'))
        ? newData.steelPath
        : undefined,
    syndicateM: newData.syndicateMissions.filter((m) => !notified.includes(m.id)),
    tweets: newData.twitter ? newData.twitter.filter((t) => t && !notified.includes(t.uniqueId)) : [],
    updates: newData.news.filter((n) => (n.update || updtReg.test(n.message)) && !n.stream && !notified.includes(n.id)),

    arbitration:
      newData.arbitration && newData.arbitration.enemy && !notified.includes(asId(newData.arbitration, 'arbitration'))
        ? newData.arbitration
        : undefined,
    outposts: newData.sentientOutposts.active && !notified.includes(newData.sentientOutposts.id),
  };

  const ostron = newData.syndicateMissions.filter((mission) => mission.syndicate === 'Ostrons')[0];
  if (ostron) {
    data.cetusCycle.bountyExpiry = ostron.expiry;
  }

  /* Nightwave */
  if (newData.nightwave) {
    const nWaveChallenges = newData.nightwave.activeChallenges.filter(
      (challenge) => challenge.active && !notified.includes(challenge.id)
    );
    data.nightwave = nWaveChallenges.length ? { ...JSON.parse(JSON.stringify(newData.nightwave)) } : undefined;
    if (data.nightwave) {
      data.nightwave.activeChallenges = nWaveChallenges;
    }
  }

  return data;
};

const transformMissionType = (rawType) =>
  rawType
    .toLowerCase()
    .replace(/dark sector/gi, '')
    .replace(/\s/g, '')
    .trim();

export default class Notifier {
  #settings;
  #worldStates;
  #broadcaster;

  constructor({ settings, client, worldStates, workerCache }) {
    this.#settings = settings;
    this.#worldStates = worldStates;
    this.#broadcaster = new Broadcaster({
      client,
      settings: this.#settings,
      workerCache,
    });
    logger.info('Ready', 'WS');

    platforms.forEach((p) => {
      beats[p] = {
        lastUpdate: Date.now(),
        currCycleStart: undefined,
      };
    });
  }

  /** Start the notifier */
  async start() {
    Object.entries(this.#worldStates).forEach(([, ws]) => {
      ws.on('newData', async (platform, newData) => {
        await this.#onNewData(platform, newData);
      });
    });
  }

  /**
   * Send notifications on new data from worldstate
   * @param  {string} platform Platform to be updated
   * @param {string} locale language identifier to be updated
   * @param  {Object} newData  Updated data from the worldstate
   */
  async #onNewData(platform, locale, newData) {
    const key = `${platform}:${locale}`;
    // don't wait for the previous to finish, this creates a giant backup,
    //  adding 4 new entries every few seconds
    if (updating.has(platform) || updating.has(`${platform}:cycles`)) return;

    beats[platform].currCycleStart = Date.now();
    if (!newData?.timestamp) return;

    // Set up data to notify
    updating.add(key);
    const notifiedIds = await this.#settings.getNotifiedIds(key);
    await this.#sendNew(platform, locale, newData, notifiedIds, buildNotifiableData(newData, notifiedIds));
    updating.remove(key);
  }

  async #sendNew(
    platform,
    locale,
    rawData,
    notifiedIds,
    {
      alerts,
      arbitration,
      archonHunt,
      dailyDeals,
      events,
      fissures,
      invasions,
      news,
      acolytes,
      sortie,
      syndicateM,
      baro,
      tweets,
      nightwave,
      featuredDeals,
      streams,
      popularDeals,
      primeAccess,
      updates,
      conclave,
      outposts,
      steelPath,
    }
  ) {
    // Send all notifications
    try {
      logger.silly(`sending new data on ${platform}...`);
      const deps = { platform, locale, i18n: i18ns[locale] };

      this.#sendAcolytes(acolytes, deps);

      if (baro) {
        this.#sendBaro(baro, deps);
      }
      if (conclave && conclave.length > 0) {
        this.#sendConclaveDailies(conclave, deps);
        this.#sendConclaveWeeklies(conclave, deps);
      }
      if (tweets && tweets.length > 0) {
        this.#sendTweets(tweets, deps);
      }
      this.#sendDarvo(dailyDeals, deps);
      this.#sendEvent(events, deps);
      this.#sendFeaturedDeals(featuredDeals, deps);
      this.#sendFissures(fissures, deps);
      this.#sendNews(news, deps);
      this.#sendStreams(streams, deps);
      this.#sendPopularDeals(popularDeals, deps);
      this.#sendPrimeAccess(primeAccess, deps);
      this.#sendInvasions(invasions, deps);
      this.#sendSortie(sortie, deps);
      this.#sendSyndicates(syndicateM, deps);
      this.#sendUpdates(updates, deps);
      this.#sendAlerts(alerts, deps);
      this.#sendSentientOutposts(outposts, deps);
      this.#sendNightwave(nightwave, deps);
      this.#sendArbitration(arbitration, deps);
      await this.#sendSteelPath(steelPath, deps);
      await this.#sendArchonHunt(archonHunt, deps);
    } catch (e) {
      logger.error(e);
    } finally {
      beats[platform][locale].lastUpdate = Date.now();
    }

    const alreadyNotified = [
      ...rawData.persistentEnemies.map((a) => a.pid),
      `${rawData.voidTrader.id}${rawData.voidTrader.active ? '1' : '0'}`,
      ...rawData.fissures.map((f) => f.id),
      ...rawData.invasions.map((i) => i.id),
      ...rawData.news.map((n) => n.id),
      ...rawData.events.map((e) => e.id),
      ...rawData.alerts.map((a) => a.id),
      rawData.sortie.id,
      ...rawData.syndicateMissions.map((m) => m.id),
      ...rawData.flashSales.map((s) => s.id),
      ...rawData.dailyDeals.map((d) => d.id),
      ...rawData.conclaveChallenges.map((cc) => cc.id),
      ...rawData.weeklyChallenges.map((w) => w.id),
      rawData.arbitration && rawData.arbitration.enemy ? asId(rawData.arbitration, 'arbitration') : 'arbitration:0',
      ...(rawData.twitter ? rawData.twitter.map((t) => t.uniqueId) : []),
      ...(rawData.nightwave && rawData.nightwave.active
        ? rawData.nightwave.activeChallenges.filter((c) => c.active).map((c) => c.id)
        : []),
      rawData.sentientOutposts.id,
      rawData.steelPath && rawData.steelPath.expiry ? asId(rawData.steelPath, 'steelpath') : 'steelpath:0',
      rawData.archonHunt.id,
    ].filter((a) => a);

    await this.#settings.setNotifiedIds(platform, alreadyNotified);
    logger.silly(`completed sending notifications for ${platform}`);
  }

  /**
   * @typedef {Object} BroadcastOptions
   * @property Embed
   * @property type
   * @property platform
   * @property thumb
   * @property items
   * @property i18n
   * @property {Locale} locale
   * @property {(Object) => string} typeGenerator generator for providing a type string
   */

  /**
   *
   * @param sendable
   * @param Embed
   * @param type
   * @param platform
   * @param thumb
   * @param items
   * @param i18n
   * @param locale
   * @param typeGenerator
   * @returns {exports<Array<Object>|Shard[]|void|*>}
   */
  async #standardBroadcast(sendable, { Embed, type, platform, thumb, items, i18n, locale, typeGenerator }) {
    if (Array.isArray(sendable)) {
      return Promise.mapSeries(sendable, (subsendable) =>
        this.#standardBroadcast(subsendable, {
          Embed,
          type: typeGenerator ? typeGenerator(subsendable) : type,
          platform,
          thumb,
          items,
        })
      );
    }
    const embed = new Embed(sendable, { platform, i18n, locale });
    embed.thumbnail.url = thumb || embed.thumbnail.url;
    return this.#broadcaster.broadcast(embed, platform, type, items);
  }

  async #sendAcolytes(newAcolytes, deps) {
    return this.#standardBroadcast(newAcolytes, {
      Embed: embeds.Acolyte,
      typeGenerator: (acolyte) => `enemies${acolyte.isDiscovered ? '' : '.departed'}`,
      ...deps,
    });
  }

  async #sendAlerts(newAlerts, deps) {
    return Promise.mapSeries(newAlerts, async (alert) => {
      let thumb;
      try {
        thumb =
          !(alert.rewardTypes.includes('reactor') && alert.rewardTypes.includes('catalyst')) &&
          (await getThumbnailForItem(alert.mission.reward.itemString));
      } catch (e) {
        logger.error(e);
      }
      return this.#standardBroadcast(alert, {
        Embed: embeds.Alert,
        type: 'alerts',
        items: alert.rewardTypes,
        thumb,
        ...deps,
      });
    });
  }

  async #sendArbitration(arbitration, deps) {
    if (!arbitration || !arbitration.enemy) return;
    const type = `arbitration.${arbitration.enemy.toLowerCase()}.${transformMissionType(arbitration.type)}`;
    return this.#standardBroadcast(arbitration, { Embed: embeds.Arbitration, type, ...deps });
  }

  async #sendArchonHunt(newArchonHunt, deps) {
    if (!newArchonHunt) return;
    const thumb = await getThumbnailForItem(newArchonHunt.boss, true);
    return this.#standardBroadcast(newArchonHunt, {
      Embed: embeds.Sortie,
      type: 'archonhunt',
      thumb,
      ...deps,
    });
  }

  async #sendBaro(newBaro, deps) {
    const embed = new embeds.VoidTrader(newBaro, deps);
    if (embed.fields.length > 25) {
      const pages = createGroupedArray(embed.fields, 15);
      return Promise.mapSeries(pages, async (page) => {
        const tembed = { ...embed };
        tembed.fields = page;
        this.#broadcaster.broadcast(tembed, deps.platform, 'baro');
      });
    }
  }

  async #sendConclaveDailies(newDailies, deps) {
    const dailies = newDailies.filter((challenge) => challenge.category === 'day');
    if (dailies.length > 0 && dailies[0].activation) {
      const embed = new embeds.Conclave(dailies, {
        category: 'day',
        ...deps,
      });
      return this.#broadcaster.broadcast(embed, deps.platform, 'conclave.dailies');
    }
  }

  async #sendConclaveWeeklies(newWeeklies, deps) {
    const weeklies = newWeeklies.filter((challenge) => challenge.category === 'week');
    if (weeklies.length > 0) {
      const embed = new embeds.Conclave(weeklies, {
        category: 'week',
        ...deps,
      });
      return this.#broadcaster.broadcast(embed, deps.platform, 'conclave.weeklies');
    }
  }

  async #sendDarvo(newDarvoDeals, deps) {
    return this.#standardBroadcast(newDarvoDeals, { Embed: embeds.Darvo, type: 'darvo', ...deps });
  }

  async #sendEvent(newEvents, deps) {
    return this.#standardBroadcast(newEvents, { Embed: embeds.Event, type: 'operation', ...deps });
  }

  async #sendFeaturedDeals(newFeaturedDeals, deps) {
    return this.#standardBroadcast(newFeaturedDeals, { Embed: embeds.Sales, type: 'deals.featuredDeals', ...deps });
  }

  async #sendFissures(newFissures, deps) {
    return this.#standardBroadcast(newFissures, {
      Embed: embeds.Fissure,
      platform: deps.platform,
      typeGenerator: (fissure) => `fissures.t${fissure.tierNum}.${transformMissionType(fissure.missionType)}`,
    });
  }

  async #sendInvasions(newInvasions, deps) {
    const type = 'invasions';
    return Promise.mapSeries(newInvasions, async (invasion) => {
      let thumb;
      try {
        thumb =
          !(invasion.rewardTypes.includes('reactor') && invasion.rewardTypes.includes('catalyst')) &&
          (await getThumbnailForItem(invasion.attackerReward.itemString || invasion.defenderReward.itemString));
      } catch (e) {
        logger.error(e);
      }
      return this.#standardBroadcast(invasion, {
        Embed: embeds.Invasion,
        items: invasion.rewardTypes,
        platform: deps.platform,
        type,
        thumb,
      });
    });
  }

  async #sendNews(newNews, deps, type) {
    type = type || 'news';
    return this.#standardBroadcast(newNews, { Embed: embeds.News, platform, type });
  }

  async #sendNightwave(nightwave, deps) {
    if (!nightwave) return;
    if (nightwave.activeChallenges.length) {
      return Promise?.mapSeries(nightwave?.active, async (challenge) => {
        const nwCopy = { ...nightwave };
        nwCopy.activeChallenges = [challenge];
        const embed = new embeds.Nightwave(nwCopy, deps);
        return this.#broadcaster.broadcast(embed, deps.platform, makeNightwaveType(challenge));
      });
    }
    const embed = new embeds.Nightwave(nightwave, deps);
    return this.#broadcaster.broadcast(embed, deps.platform, 'nightwave');
  }

  async #sendPopularDeals(newPopularDeals, deps) {
    const type = 'deals.popular';
    return this.#standardBroadcast(newPopularDeals, { Embed: embeds.Sales, ...deps, type });
  }

  async #sendPrimeAccess(newNews, deps) {
    return this.#sendNews(newNews, deps, 'primeaccess');
  }

  async #sendSortie(newSortie, deps) {
    if (!newSortie) return;
    const thumb = await getThumbnailForItem(newSortie.boss, true);
    return this.#standardBroadcast(newSortie, {
      Embed: embeds.Sortie,
      type: 'sorties',
      thumb,
      ...deps,
    });
  }

  async #sendSteelPath(steelPath, deps) {
    if (!steelPath || !steelPath.currentReward) return;
    const type =
      steelPath.currentReward.name && steelPath.currentReward.name.includes('Umbra') ? 'steelpath.umbra' : 'steelpath';
    return this.#standardBroadcast(steelPath, { Embed: embeds.SteelPath, type, ...deps });
  }

  async #sendStreams(newStreams, deps) {
    return this.#sendNews(newStreams, deps, 'streams');
  }

  async #checkAndSendSyndicate(embed, syndicate, deps) {
    if (
      embed.description &&
      embed.description.length > 0 &&
      embed.description !== 'No such Syndicate' &&
      embed?.fields?.[0].name !== 'No such Syndicate'
    ) {
      return this.#broadcaster.broadcast(embed, deps.platform, syndicate);
    }
    return undefined;
  }

  async #sendSyndicates(newSyndicates, deps) {
    if (!newSyndicates || !newSyndicates[0]) return;
    return Promise.mapSeries(syndicates, async ({ key, display, prefix, notifiable }) => {
      if (notifiable) {
        const embed = new embeds.Syndicate(newSyndicates, {
          display,
          ...deps,
        });
        const eKey = `${prefix || ''}${key}`;
        return this.#checkAndSendSyndicate(embed, eKey, deps);
      }
    });
  }

  async #sendTweets(newTweets, deps) {
    return Promise.mapSeries(newTweets, async (t) =>
      this.#standardBroadcast(t, {
        Embed: embeds.Tweet,
        type: t.id,
        ...deps,
      })
    );
  }

  async #sendUpdates(newNews, deps) {
    return this.#sendNews(newNews, 'updates', deps);
  }

  async #sendSentientOutposts(outpost, deps) {
    if (outpost.mission) {
      return this.#standardBroadcast(outpost, { Embed: embeds.Outposts, type: 'outposts', ...deps });
    }
  }
}
