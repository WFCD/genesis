import Broadcaster from '../Broadcaster.js';
import logger from '../../utilities/Logger.js';

import { asId, between, embeds, getThumbnailForItem, perLanguage } from '../NotifierUtils.js';
import { syndicates } from '../../resources/index.js';

import { captures, createGroupedArray, platforms } from '../../utilities/CommonFunctions.js';

const updtReg = new RegExp(captures.updates, 'i');
const beats = {};
let refreshRate = process.env.WORLDSTATE_TIMEOUT || 60000;
const makeNightwaveType = (challenge) => {
  let type = 'daily';

  if (challenge.isElite) {
    type = 'elite';
  } else if (!challenge.isDaily) {
    type = 'weekly';
  }
  return `nightwave.${type}`;
};
const buildNotifiableData = (newData, platform, notified) => {
  const data = {
    acolytes: newData.persistentEnemies.filter((e) => !notified.includes(e.pid)),
    alerts: newData.alerts.filter((a) => !a.expired && !notified.includes(a.id)),
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

    /* Cycles data */
    cetusCycleChange: between(newData.cetusCycle.activation, platform, refreshRate, beats),
    earthCycleChange: between(newData.earthCycle.activation, platform, refreshRate, beats),
    vallisCycleChange: between(newData.vallisCycle.activation, platform, refreshRate, beats),
    cambionCycleChange: between(newData.cambionCycle.activation, platform, refreshRate, beats),
    cambionCycle: newData.cambionCycle,
    cetusCycle: newData.cetusCycle,
    earthCycle: newData.earthCycle,
    vallisCycle: newData.vallisCycle,
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
  #updating;

  constructor({ settings, client, worldStates, timeout, workerCache }) {
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

    this.#updating = false;
    refreshRate = timeout;
    this.#updating = [];
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
   * @param  {json} newData  Updated data from the worldstate
   */
  async #onNewData(platform, newData) {
    // don't wait for the previous to finish, this creates a giant backup,
    //  adding 4 new entries every few seconds
    if (this.#updating.includes(platform)) return;

    beats[platform].currCycleStart = Date.now();
    if (!(newData && newData.timestamp)) return;

    const notifiedIds = await this.#settings.getNotifiedIds(platform);

    // Set up data to notify
    this.#updating.push(platform);

    await this.#sendNew(platform, newData, notifiedIds, buildNotifiableData(newData, platform, notifiedIds));

    this.#updating.splice(this.#updating.indexOf(platform), 1);
  }

  async #sendNew(
    platform,
    rawData,
    notifiedIds,
    {
      alerts,
      arbitration,
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

      this.#sendAcolytes(acolytes, platform);

      if (baro) {
        this.#sendBaro(baro, platform);
      }
      if (conclave && conclave.length > 0) {
        this.#sendConclaveDailies(conclave, platform);
        this.#sendConclaveWeeklies(conclave, platform);
      }
      if (tweets && tweets.length > 0) {
        this.#sendTweets(tweets, platform);
      }
      this.#sendDarvo(dailyDeals, platform);
      this.#sendEvent(events, platform);
      this.#sendFeaturedDeals(featuredDeals, platform);
      this.#sendFissures(fissures, platform);
      this.#sendNews(news, platform);
      this.#sendStreams(streams, platform);
      this.#sendPopularDeals(popularDeals, platform);
      this.#sendPrimeAccess(primeAccess, platform);
      this.#sendInvasions(invasions, platform);
      this.#sendSortie(sortie, platform);
      this.#sendSyndicates(syndicateM, platform);
      this.#sendUpdates(updates, platform);
      this.#sendAlerts(alerts, platform);
      this.#sendSentientOutposts(outposts, platform);
      this.#sendNightwave(nightwave, platform);
      this.#sendArbitration(arbitration, platform);
      this.#sendSteelPath(steelPath, platform);
    } catch (e) {
      logger.error(e);
    } finally {
      beats[platform].lastUpdate = Date.now();
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
    ].filter((a) => a);

    await this.#settings.setNotifiedIds(platform, alreadyNotified);
    logger.silly(`completed sending notifications for ${platform}`);
  }

  async standardBroadcast(sendable, { Embed, type, platform, thumb, items }) {
    if (Array.isArray(sendable)) {
      return Promise.all(
        sendable.map((subsendable) =>
          this.standardBroadcast(subsendable, {
            Embed,
            type,
            platform,
            thumb,
            items,
          })
        )
      );
    }
    return perLanguage(async ({ i18n, locale }) => {
      const embed = new Embed(sendable, { platform, i18n, locale });
      embed.thumbnail.url = thumb || embed.thumbnail.url;
      return this.#broadcaster.broadcast(embed, platform, type, items);
    });
  }

  async #sendAcolytes(newAcolytes, platform) {
    return Promise.all(
      newAcolytes.map(async (acolyte) =>
        perLanguage(async ({ i18n, locale }) =>
          this.#broadcaster.broadcast(
            new embeds.Acolyte([acolyte], { platform, i18n, locale }),
            platform,
            `enemies${acolyte.isDiscovered ? '' : '.departed'}`
          )
        )
      )
    );
  }

  async #sendAlerts(newAlerts, platform) {
    return Promise.all(
      newAlerts.map(async (alert) => {
        let thumb;
        try {
          thumb =
            !(alert.rewardTypes.includes('reactor') && alert.rewardTypes.includes('catalyst')) &&
            (await getThumbnailForItem(alert.mission.reward.itemString));
        } catch (e) {
          logger.error(e);
        }
        return this.standardBroadcast(alert, {
          platform,
          Embed: embeds.Alert,
          type: 'alerts',
          items: alert.rewardTypes,
          thumb,
        });
      })
    );
  }

  async #sendArbitration(arbitration, platform) {
    if (!arbitration || !arbitration.enemy) return;
    const type = `arbitration.${arbitration.enemy.toLowerCase()}.${transformMissionType(arbitration.type)}`;
    return this.standardBroadcast(arbitration, { Embed: embeds.Arbitration, type, platform });
  }

  async #sendBaro(newBaro, platform) {
    return perLanguage(async ({ i18n, locale }) => {
      const embed = new embeds.VoidTrader(newBaro, { platform, i18n, locale });
      if (embed.fields.length > 25) {
        const pages = createGroupedArray(embed.fields, 15);
        return Promise.all(
          pages.map(async (page) => {
            const tembed = { ...embed };
            tembed.fields = page;
            this.#broadcaster.broadcast(tembed, platform, 'baro');
          })
        );
      }
      return this.#broadcaster.broadcast(embed, platform, 'baro');
    });
  }

  async #sendConclaveDailies(newDailies, platform) {
    const dailies = newDailies.filter((challenge) => challenge.category === 'day');
    if (dailies.length > 0 && dailies[0].activation) {
      return perLanguage(async ({ i18n, locale }) => {
        const embed = new embeds.Conclave(dailies, {
          category: 'day',
          i18n,
          locale,
          platform,
        });
        return this.#broadcaster.broadcast(embed, platform, 'conclave.dailies');
      });
    }
  }

  async #sendConclaveWeeklies(newWeeklies, platform) {
    const weeklies = newWeeklies.filter((challenge) => challenge.category === 'week');
    if (weeklies.length > 0) {
      return perLanguage(async ({ i18n, locale }) => {
        const embed = new embeds.Conclave(weeklies, {
          category: 'week',
          platform,
          i18n,
          locale,
        });
        return this.#broadcaster.broadcast(embed, platform, 'conclave.weeklies');
      });
    }
  }

  async #sendDarvo(newDarvoDeals, platform) {
    return this.standardBroadcast(newDarvoDeals, { platform, Embed: embeds.Darvo, type: 'darvo' });
  }

  async #sendEvent(newEvents, platform) {
    return this.standardBroadcast(newEvents, { Embed: embeds.Event, platform, type: 'operation' });
  }

  async #sendFeaturedDeals(newFeaturedDeals, platform) {
    return this.standardBroadcast(newFeaturedDeals, { Embed: embeds.Sales, platform, type: 'deals.featuredDeals' });
  }

  async #sendFissures(newFissures, platform) {
    return Promise.all(
      newFissures.map(async (fissure) =>
        this.standardBroadcast(newFissures, {
          Embed: embeds.Fissure,
          type: `fissures.t${fissure.tierNum}.${transformMissionType(fissure.missionType)}`,
          platform,
        })
      )
    );
  }

  async #sendInvasions(newInvasions, platform) {
    const type = 'invasions';
    return Promise.all(
      newInvasions.map(async (invasion) => {
        let thumb;
        try {
          thumb =
            !(invasion.rewardTypes.includes('reactor') && invasion.rewardTypes.includes('catalyst')) &&
            (await getThumbnailForItem(invasion.attackerReward.itemString || invasion.defenderReward.itemString));
        } catch (e) {
          logger.error(e);
        }
        return this.standardBroadcast(invasion, {
          Embed: embeds.Invasion,
          items: invasion.rewardTypes,
          platform,
          type,
          thumb,
        });
      })
    );
  }

  async #sendNews(newNews, platform, type) {
    type = type || 'news';
    return this.standardBroadcast(newNews, { Embed: embeds.News, platform, type });
  }

  async #sendNightwave(nightwave, platform) {
    if (!nightwave) return;
    return perLanguage(async ({ i18n, locale }) => {
      if (nightwave.activeChallenges.length) {
        return Promise.all(
          nightwave.activeChallenges.map(async (challenge) => {
            const nwCopy = { ...nightwave };
            nwCopy.activeChallenges = [challenge];
            const embed = new embeds.Nightwave(nwCopy, { platform, i18n, locale });
            embed.locale = locale;
            return this.#broadcaster.broadcast(embed, platform, makeNightwaveType(challenge));
          })
        );
      }
      const embed = new embeds.Nightwave(nightwave, { platform, i18n, locale });
      embed.locale = locale;
      return this.#broadcaster.broadcast(embed, platform, 'nightwave');
    });
  }

  async #sendPopularDeals(newPopularDeals, platform) {
    const type = 'deals.popular';
    return this.standardBroadcast(newPopularDeals, { Embed: embeds.Sales, platform, type });
  }

  async #sendPrimeAccess(newNews, platform) {
    return this.#sendNews(newNews, platform, 'primeaccess');
  }

  async #sendSortie(newSortie, platform) {
    if (!newSortie) return;
    const thumb = await getThumbnailForItem(newSortie.boss, true);
    return this.standardBroadcast(newSortie, {
      Embed: embeds.Sortie,
      type: 'sorties',
      platform,
      thumb,
    });
  }

  async #sendSteelPath(steelPath, platform) {
    if (!steelPath || !steelPath.currentReward) return;
    const type =
      steelPath.currentReward.name && steelPath.currentReward.name.includes('Umbra') ? 'steelpath.umbra' : 'steelpath';
    return this.standardBroadcast(steelPath, { Embed: embeds.SteelPath, type, platform });
  }

  async #sendStreams(newStreams, platform) {
    return this.#sendNews(newStreams, platform, 'streams');
  }

  async checkAndSendSyndicate(embed, syndicate, platform) {
    if (
      embed.description &&
      embed.description.length > 0 &&
      embed.description !== 'No such Syndicate' &&
      embed?.fields?.[0].name !== 'No such Syndicate'
    ) {
      return this.#broadcaster.broadcast(embed, platform, syndicate);
    }
    return undefined;
  }

  async #sendSyndicates(newSyndicates, platform) {
    if (!newSyndicates || !newSyndicates[0]) return;
    await Promise.all(
      syndicates.map(async ({ key, display, prefix, notifiable }) => {
        if (notifiable) {
          return perLanguage(async ({ i18n, locale }) => {
            const embed = new embeds.Syndicate(newSyndicates, {
              display,
              platform,
              i18n,
              locale,
            });
            const eKey = `${prefix || ''}${key}`;
            return this.checkAndSendSyndicate(embed, eKey, platform);
          });
        }
      })
    );
  }

  async #sendTweets(newTweets, platform) {
    return Promise.all(
      newTweets.map((t) =>
        this.standardBroadcast(t, {
          Embed: embeds.Tweet,
          platform,
          type: t.id,
        })
      )
    );
  }

  async #sendUpdates(newNews, platform) {
    return this.#sendNews(newNews, platform, 'updates');
  }

  async #sendSentientOutposts(outpost, platform) {
    if (outpost.mission) {
      return this.standardBroadcast(outpost, { Embed: embeds.Outposts, type: 'outposts', platform });
    }
  }
}
