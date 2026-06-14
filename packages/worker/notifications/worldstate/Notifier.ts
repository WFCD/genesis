// @ts-nocheck -- incremental TS migration; worker notification runtime
import Promise from 'bluebird';

import logger from '#shared/utilities/Logger';
import { syndicates } from '#shared/resources';
import { captures, createGroupedArray, platforms, games } from '#shared/utilities/CommonFunctions';
import { isActive, isActiveArbitration, isExpired, rewardString } from '#shared/utilities/WorldState';
import { resolveInvasionThumbnail } from '#shared/embeds/InvasionEmbed';
import { fissureNodeTypeKey, fissureTypeKey, transformMissionType } from '#shared/utilities/FissureTracking';

import { asId, embeds, getThumbnailForItem, i18ns, notifyKey, trackableClaimId, updating } from '../NotifierUtils';
import Broadcaster from '../Broadcaster';

const wrap = (fn) => {
  try {
    return fn();
  } catch (e) {
    logger.error(e);
  }
};
const wrapPromise = async (prom, indicator) => {
  try {
    return await prom;
  } catch (e) {
    logger.error(e, indicator ? `Failure running ${indicator}` : 'Failure running notifier task');
  }
};
const updtReg = new RegExp(captures.updates, 'i');
const beats = {};

const normalizeNotifiedIds = (notified) => {
  if (Array.isArray(notified)) return notified;
  if (typeof notified === 'string') {
    try {
      const parsed = JSON.parse(notified);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
};

const summarizeNotifiable = (data) =>
  Object.entries(data)
    .filter(([, value]) => (Array.isArray(value) ? value.length : value))
    .map(([key, value]) => `${key}:${Array.isArray(value) ? value.length : 1}`)
    .join(', ');
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
  try {
    const data = {};

    data.acolytes = wrap(() => newData.persistentEnemies?.filter((e) => !notified.includes(e.pid)));
    data.alerts = wrap(() => newData.alerts?.filter((a) => !isExpired(a) && !notified.includes(a.id)));
    data.archonHunt = wrap(() =>
      newData.archonHunt && !isExpired(newData.archonHunt) && !notified?.includes(newData.archonHunt.id)
        ? newData.archonHunt
        : undefined
    );
    data.baros = wrap(() =>
      newData.voidTraders?.length &&
      newData.voidTraders?.filter((vt) => !notified.includes(`${vt.id}${isActive(vt) ? '1' : '0'}`))?.length
        ? newData.voidTraders?.filter((vt) => !notified.includes(`${vt.id}${isActive(vt) ? '1' : '0'}`))
        : undefined
    );
    data.conclave = wrap(() =>
      newData.conclaveChallenges.filter((cc) => !isExpired(cc) && !cc.rootChallenge && !notified.includes(cc.id))
    );
    data.dailyDeals = wrap(() => newData.dailyDeals.filter((dd) => !notified.includes(dd.id)));
    data.events = wrap(() => newData.events.filter((e) => !isExpired(e) && !notified.includes(e.id)));
    data.invasions = wrap(() => newData.invasions.filter((i) => i.rewardTypes.length && !notified.includes(i.id)));
    data.featuredDeals = wrap(() => newData.flashSales.filter((d) => d.isFeatured && !notified.includes(d.id)));
    data.fissures = wrap(() => newData.fissures.filter((f) => !notified.includes(f.id)));
    data.news = wrap(() =>
      newData.news.filter(
        (n) => !n.primeAccess && !n.update && !updtReg.test(n.message) && !n.stream && !notified.includes(n.id)
      )
    );
    data.popularDeals = wrap(() => newData.flashSales.filter((d) => d.isPopular && !notified.includes(d.id)));
    data.primeAccess = wrap(() => newData.news.filter((n) => n.primeAccess && !n.stream && !notified.includes(n.id)));
    data.sortie = wrap(() =>
      newData.sortie && !isExpired(newData.sortie) && !notified.includes(newData.sortie.id) ? newData.sortie : undefined
    );
    data.streams = wrap(() => newData.news.filter((n) => n.stream && !notified.includes(n.id)));
    data.steelPath = wrap(() =>
      newData.steelPath.currentReward && !notified.includes(asId(newData.steelPath, 'steelpath'))
        ? newData.steelPath
        : undefined
    );
    data.syndicateM = wrap(() => newData.syndicateMissions.filter((m) => !notified.includes(m.id)));
    data.tweets = wrap(() =>
      newData.twitter ? newData.twitter.filter((t) => t && !notified.includes(t.uniqueId)) : []
    );
    data.updates = wrap(() =>
      newData.news.filter((n) => (n.update || updtReg.test(n.message)) && !n.stream && !notified.includes(n.id))
    );

    data.arbitration = wrap(() =>
      isActiveArbitration(newData.arbitration) && !notified.includes(asId(newData.arbitration, 'arbitration'))
        ? newData.arbitration
        : undefined
    );
    data.outposts = wrap(() => isActive(newData.sentientOutposts) && !notified.includes(newData.sentientOutposts.id));

    try {
      /* Nightwave */
      if (newData.nightwave) {
        const nWaveChallenges = newData.nightwave.activeChallenges.filter(
          (challenge) => isActive(challenge) && !notified.includes(challenge.id)
        );
        data.nightwave = nWaveChallenges.length ? { ...JSON.parse(JSON.stringify(newData.nightwave)) } : undefined;
        if (data.nightwave) {
          data.nightwave.activeChallenges = nWaveChallenges;
        }
      }
    } catch (e) {
      logger.error(`error parsing nightwave data: ${e}`);
    }
    return data;
  } catch (e) {
    logger.error(e);
  }
  return {};
};

const collectWorldstateClaimIds = (data) => {
  const ids = new Set();
  const add = (id) => {
    if (id) ids.add(String(id));
  };

  (data.acolytes || []).forEach((acolyte) =>
    add(trackableClaimId(acolyte.pid, `enemies${acolyte.isDiscovered ? '' : '.departed'}`))
  );

  (data.baros || []).forEach((vt) => add(`${vt.id}${isActive(vt) ? '1' : '0'}`));

  if (data.conclave?.length) {
    const dailies = data.conclave.filter((challenge) => challenge.category === 'day');
    const weeklies = data.conclave.filter((challenge) => challenge.category === 'week');
    if (dailies.length && dailies[0].activation) add(trackableClaimId('conclave.dailies', dailies[0].id));
    if (weeklies.length) add(trackableClaimId('conclave.weeklies', weeklies[0].id));
  }

  (data.dailyDeals || []).forEach((deal) => add(trackableClaimId(deal.id, 'darvo')));
  (data.events || []).forEach((event) => add(trackableClaimId(event.id, 'operation')));
  (data.featuredDeals || []).forEach((deal) => add(trackableClaimId(deal.id, 'deals.featuredDeals')));
  (data.popularDeals || []).forEach((deal) => add(trackableClaimId(deal.id, 'deals.popular')));

  (data.fissures || []).forEach((fissure) => {
    add(trackableClaimId(fissure.id, fissureTypeKey(fissure)));
    const nodeType = fissureNodeTypeKey(fissure);
    if (nodeType) add(trackableClaimId(fissure.id, nodeType));
  });

  (data.invasions || []).forEach((invasion) => add(invasion.id));

  (data.news || []).forEach((item) => add(trackableClaimId(item.id, 'news')));
  (data.streams || []).forEach((item) => add(trackableClaimId(item.id, 'streams')));
  (data.updates || []).forEach((item) => add(trackableClaimId(item.id, 'updates')));
  (data.primeAccess || []).forEach((item) => add(trackableClaimId(item.id, 'primeaccess')));

  if (data.sortie) add(trackableClaimId(data.sortie.id, 'sorties'));

  (data.alerts || []).forEach((alert) => add(trackableClaimId(alert.id, 'alerts')));

  if (data.archonHunt) add(trackableClaimId(data.archonHunt.id, 'archonhunt'));

  if (data.arbitration) add(asId(data.arbitration, 'arbitration'));

  if (data.steelPath) add(asId(data.steelPath, 'steelpath'));

  if (data.outposts?.mission) add(trackableClaimId(data.outposts.id, 'outposts'));

  (data.tweets || []).forEach((tweet) => add(tweet.uniqueId));

  if (data.nightwave?.activeChallenges?.length) {
    data.nightwave.activeChallenges.forEach((challenge) =>
      add(trackableClaimId(challenge.id, makeNightwaveType(challenge)))
    );
  }

  if (data.syndicateM?.length) {
    syndicates.forEach(({ key, prefix, notifiable }) => {
      if (notifiable) add(trackableClaimId(`${prefix || ''}${key}`, data.syndicateM[0].id));
    });
  }

  return [...ids];
};

const buildWorldstateSnapshot = (rawData) =>
  [
    ...rawData.persistentEnemies.map((a) => a.pid),
    ...(rawData.voidTraders?.length
      ? rawData.voidTraders.map((vt) => `${vt.id}${isActive(vt) ? '1' : '0'}`)
      : rawData.voidTrader
        ? [`${rawData.voidTrader.id}${isActive(rawData.voidTrader) ? '1' : '0'}`]
        : []),
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
    ...(rawData?.weeklyChallenges?.map((w) => w.id) ?? []),
    isActiveArbitration(rawData.arbitration) ? asId(rawData.arbitration, 'arbitration') : 'arbitration:0',
    ...(rawData.twitter ? rawData.twitter.map((t) => t.uniqueId) : []),
    ...(rawData.nightwave && isActive(rawData.nightwave)
      ? rawData.nightwave.activeChallenges.filter(isActive).map((c) => c.id)
      : []),
    rawData.sentientOutposts.id,
    rawData.steelPath && rawData.steelPath.expiry ? asId(rawData.steelPath, 'steelpath') : 'steelpath:0',
    rawData.archonHunt.id,
  ].filter(Boolean);

export default class Notifier {
  #settings;
  #worldStates;
  #broadcaster;
  #claimedIds = null;
  #deliveredClaimIds = null;
  #deliveredSnapshotIds = null;

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
      ws.on('newData', this.onNewData.bind(this));
    });
  }

  /**
   * Send notifications on new data from worldstate
   * @param  {string} platform Platform to be updated
   * @param {string} locale language identifier to be updated
   * @param  {Object} newData  Updated data from the worldstate
   */
  async onNewData(platform, locale, newData) {
    const key = `${platform}:${locale}`;
    // don't wait for the previous to finish, this creates a giant backup,
    //  adding 4 new entries every few seconds
    if (updating.has(key) || updating.has(`${key}:cycles`)) return;

    if (!beats[key]) beats[key] = { lastUpdate: Date.now(), currCycleStart: undefined };
    beats[key].currCycleStart = Date.now();
    if (!newData?.timestamp) return;

    // Set up data to notify
    updating.add(key);
    const notifiedIds = normalizeNotifiedIds(await this.#settings.getNotifiedIds(key));
    try {
      const notifiableData = buildNotifiableData(newData, notifiedIds);
      const summary = summarizeNotifiable(notifiableData);
      if (summary) {
        logger.debug(`notifiable ${key}: ${summary}`, 'WS');
      } else {
        logger.debug(`notifiable ${key}: none (${notifiedIds.length} ids in dedup store)`, 'WS');
      }
      await this.#sendNew(platform, locale, newData, notifiedIds, notifiableData);
    } catch (e) {
      logger.error(e);
    }
    updating.remove(key);
  }

  async #sendNew(platform, locale, rawData, notifiedIds, notifiableData) {
    const {
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
      baros,
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
    } = notifiableData;
    const key = notifyKey(platform, locale);
    let claimedIds = new Set();
    const deliveredClaimIds = new Set();
    const deliveredSnapshotIds = new Set();

    // Send all notifications
    try {
      logger.silly(`sending new data on ${platform} in ${locale}...`);
      if (!i18ns[locale]) {
        logger.error(`No notifier i18n constructed for ${locale}`);
        return;
      }

      const claimIds = collectWorldstateClaimIds(notifiableData);
      claimedIds = new Set(await this.#settings.claimNotifiedIds(key, claimIds));
      this.#claimedIds = claimedIds;
      this.#deliveredClaimIds = deliveredClaimIds;
      this.#deliveredSnapshotIds = deliveredSnapshotIds;
      if (claimIds.length) {
        logger.debug(`claimed ${claimedIds.size}/${claimIds.length} ids for ${key}`, 'WS');
      }

      const deps = { platform, locale, i18n: i18ns[locale] };
      await this.#sendAcolytes(acolytes, deps);
      if (games.includes('BARO') && baros?.length) {
        await Promise.map(baros, (baro) => this.#sendBaro(baro, deps));
      }
      if (conclave && conclave.length > 0) {
        await Promise.all([this.#sendConclaveDailies(conclave, deps), this.#sendConclaveWeeklies(conclave, deps)]);
      }
      if (tweets && tweets.length > 0) {
        await this.#sendTweets(tweets, deps);
      }
      await wrapPromise(this.#sendDarvo(dailyDeals, deps));
      await wrapPromise(this.#sendEvent(events, deps));
      await wrapPromise(this.#sendFeaturedDeals(featuredDeals, deps));
      await wrapPromise(this.#sendFissures(fissures, deps));
      await wrapPromise(this.#sendNews(news, deps));
      await wrapPromise(this.#sendStreams(streams, deps));
      await wrapPromise(this.#sendPopularDeals(popularDeals, deps));
      await wrapPromise(this.#sendPrimeAccess(primeAccess, deps));
      await wrapPromise(this.#sendInvasions(invasions, deps));
      await wrapPromise(this.#sendSortie(sortie, deps));
      await wrapPromise(this.#sendSyndicates(syndicateM, deps));
      await wrapPromise(this.#sendUpdates(updates, deps));
      await wrapPromise(this.#sendAlerts(alerts, deps));
      await wrapPromise(this.#sendSentientOutposts(outposts, deps));
      await wrapPromise(this.#sendNightwave(nightwave, deps));
      await wrapPromise(this.#sendArbitration(arbitration, deps));
      await wrapPromise(this.#sendSteelPath(steelPath, deps));
      await wrapPromise(this.#sendArchonHunt(archonHunt, deps));
    } catch (e) {
      logger.error(e);
    } finally {
      this.#claimedIds = null;
      this.#deliveredClaimIds = null;
      this.#deliveredSnapshotIds = null;
      beats[`${platform}:${locale}`].lastUpdate = Date.now();
    }

    try {
      const undelivered = [...claimedIds].filter((id) => !deliveredClaimIds.has(id));
      if (undelivered.length) {
        await this.#settings.releaseNotifiedIds(key, undelivered);
      }

      const fullSnapshot = buildWorldstateSnapshot(rawData);
      const alreadyNotified = [
        ...new Set(fullSnapshot.filter((id) => notifiedIds.includes(id) || deliveredSnapshotIds.has(String(id)))),
      ];

      await this.#settings.setNotifiedIds(`${platform}:${locale}`, alreadyNotified);
      logger.silly(`completed sending notifications for ${platform} in ${locale}`);
    } catch (e) {
      logger.error(e);
    }
  }

  /**
   * @typedef {Object} BroadcastOptions
   * @property {Discord.MessageEmbed} Embed data to send
   * @property {string} type type id to send
   * @property {string} platform platform target
   * @property {string} thumb override thumbnail url
   * @property {Array<string>} items to affect sending
   * @property {I18n} i18n internationalization function
   * @property {Locale} locale to send
   * @property {function} typeGenerator for making the type for some dynamic types
   * @property {(Object) => string} typeGenerator generator for providing a type string
   */

  /**
   * Send a "standard" broadcast message
   * @param {Object | Array<Object>} sendable thing or list of things to send
   * @param {Discord.MessageEmbed} Embed data to send
   * @param {string} type type id to send
   * @param {string} platform platform target
   * @param {string} thumb override thumbnail url
   * @param {Array<string>} items to affect sending
   * @param {I18n} i18n internationalization function
   * @param {Locale} locale to send
   * @param {function} typeGenerator for making the type for some dynamic types
   * @returns {Promise<Object[]>}
   */
  #canSend(claimId) {
    if (!claimId) return true;
    if (!this.#claimedIds) return true;
    return this.#claimedIds.has(String(claimId));
  }

  #recordDelivery(claimId, snapshotIds = []) {
    if (claimId) this.#deliveredClaimIds?.add(String(claimId));
    [].concat(snapshotIds).forEach((id) => {
      if (id) this.#deliveredSnapshotIds?.add(String(id));
    });
  }

  async #standardBroadcast(
    sendable,
    {
      Embed,
      type,
      platform,
      thumb,
      items,
      i18n,
      locale,
      typeGenerator,
      claimId = undefined,
      snapshotIds = undefined,
      buildEmbed = undefined,
      asUnit = false,
      shouldBroadcast = undefined,
      paginateFields = undefined,
    }
  ) {
    if ((Array.isArray(sendable) && !sendable.length) || !sendable) return Promise.resolve(true);
    if (!i18n) {
      logger.error(
        `No notifier i18n constructed for ${locale} sending ${type} with ${
          Array.isArray(sendable) ? 'array' : 'object'
        }`
      );
    }
    if (Array.isArray(sendable) && !asUnit) {
      return Promise.mapSeries(sendable, (subsendable) =>
        this.#standardBroadcast(subsendable, {
          Embed,
          type: typeGenerator ? typeGenerator(subsendable) : type,
          platform,
          thumb,
          items,
          i18n,
          locale,
          claimId,
          snapshotIds,
          buildEmbed,
          asUnit,
          shouldBroadcast,
          paginateFields,
        })
      );
    }

    const resolvedType = type;
    const resolvedClaimId = claimId ?? trackableClaimId(sendable?.id, resolvedType);
    if (resolvedClaimId && !this.#canSend(resolvedClaimId)) {
      logger.debug(`skipping duplicate ${resolvedClaimId}`, 'WS');
      return;
    }

    const embed = buildEmbed
      ? buildEmbed({ sendable, platform, i18n, locale, thumb, items })
      : new Embed(sendable, { platform, i18n, locale });
    if (!buildEmbed) {
      embed.thumbnail.url = thumb || embed.thumbnail.url;
    }

    if (shouldBroadcast && !shouldBroadcast(embed)) {
      return undefined;
    }

    const broadcastOpts = { platform, type: resolvedType, items, locale };
    const deliverySnapshot = snapshotIds ?? sendable?.uniqueId ?? sendable?.id ?? resolvedClaimId;
    let sent;

    if (paginateFields && embed.fields?.length > paginateFields.threshold) {
      const pages = createGroupedArray(embed.fields, paginateFields.size);
      sent = true;
      await Promise.mapSeries(pages, async (page) => {
        const pageEmbed = { ...embed, fields: page };
        const pageSent = await this.#broadcaster.broadcast(pageEmbed, broadcastOpts);
        if (!pageSent) sent = false;
      });
    } else {
      sent = await this.#broadcaster.broadcast(embed, broadcastOpts);
    }

    if (sent) {
      this.#recordDelivery(resolvedClaimId, deliverySnapshot);
    }
    return sent;
  }

  async #sendAcolytes(newAcolytes, deps) {
    return this.#standardBroadcast(newAcolytes, {
      ...deps,
      Embed: embeds.Acolyte,
      typeGenerator: (acolyte) => `enemies${acolyte.isDiscovered ? '' : '.departed'}`,
    });
  }

  async #sendAlerts(newAlerts, deps) {
    return Promise.mapSeries(newAlerts, async (alert) => {
      let thumb;
      try {
        thumb =
          !(alert.rewardTypes.includes('reactor') && alert.rewardTypes.includes('catalyst')) &&
          (await getThumbnailForItem(rewardString(alert.mission.reward, false)));
      } catch (e) {
        logger.error(e);
      }
      return this.#standardBroadcast(alert, {
        ...deps,
        Embed: embeds.Alert,
        type: 'alerts',
        items: alert.rewardTypes,
        thumb,
      });
    });
  }

  async #sendArbitration(arbitration, deps) {
    if (!isActiveArbitration(arbitration)) return;
    const type = `arbitration.${arbitration.enemy.toLowerCase()}.${transformMissionType(arbitration.typeKey)}`;
    return this.#standardBroadcast(arbitration, {
      ...deps,
      Embed: embeds.Arbitration,
      type,
      claimId: asId(arbitration, 'arbitration'),
    });
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
    const claimId = `${newBaro.id}${isActive(newBaro) ? '1' : '0'}`;
    return this.#standardBroadcast(newBaro, {
      ...deps,
      Embed: embeds.VoidTrader,
      type: 'baro',
      claimId,
      snapshotIds: claimId,
      paginateFields: { threshold: 25, size: 15 },
    });
  }

  async #sendConclaveDailies(newDailies, deps) {
    const dailies = newDailies.filter((challenge) => challenge.category === 'day');
    if (dailies.length > 0 && dailies[0].activation) {
      return this.#standardBroadcast(dailies, {
        ...deps,
        asUnit: true,
        type: 'conclave.dailies',
        claimId: trackableClaimId('conclave.dailies', dailies[0].id),
        snapshotIds: dailies.map((challenge) => challenge.id),
        buildEmbed: () => new embeds.Conclave(dailies, { category: 'day', ...deps }),
      });
    }
  }

  async #sendConclaveWeeklies(newWeeklies, deps) {
    const weeklies = newWeeklies.filter((challenge) => challenge.category === 'week');
    if (weeklies.length > 0) {
      return this.#standardBroadcast(weeklies, {
        ...deps,
        asUnit: true,
        type: 'conclave.weeklies',
        claimId: trackableClaimId('conclave.weeklies', weeklies[0].id),
        snapshotIds: weeklies.map((challenge) => challenge.id),
        buildEmbed: () => new embeds.Conclave(weeklies, { category: 'week', ...deps }),
      });
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
    try {
      return Promise.mapSeries(newFissures, async (fissure) => {
        await this.#standardBroadcast(fissure, { ...deps, Embed: embeds.Fissure, type: fissureTypeKey(fissure) });
        const nodeType = fissureNodeTypeKey(fissure);
        if (nodeType) {
          await this.#standardBroadcast(fissure, { ...deps, Embed: embeds.Fissure, type: nodeType });
        }
      });
    } catch (e) {
      logger.error(`tried to send fissures (${newFissures.map((f) => f.id).join(', ')} but failed: ${e}`);
    }
  }

  async #sendInvasions(newInvasions, deps) {
    const type = 'invasions';
    return Promise.mapSeries(newInvasions, async (invasion) =>
      this.#standardBroadcast(invasion, {
        ...deps,
        Embed: embeds.Invasion,
        items: invasion.rewardTypes,
        type,
        thumb: resolveInvasionThumbnail(invasion),
        claimId: invasion.id,
      })
    );
  }

  async #sendNews(newNews, deps, type) {
    type = type || 'news';
    return this.#standardBroadcast(newNews, { ...deps, Embed: embeds.News, type });
  }

  async #sendNightwave(nightwave, deps) {
    if (!nightwave?.activeChallenges?.[0]) return;
    if (nightwave.activeChallenges.length) {
      return Promise?.mapSeries(nightwave?.activeChallenges, async (challenge) =>
        this.#standardBroadcast(nightwave, {
          ...deps,
          asUnit: true,
          type: makeNightwaveType(challenge),
          claimId: trackableClaimId(challenge.id, makeNightwaveType(challenge)),
          snapshotIds: challenge.id,
          buildEmbed: () => {
            const nwCopy = { ...nightwave, activeChallenges: [challenge] };
            return new embeds.Nightwave(nwCopy, deps);
          },
        })
      );
    }
    return this.#standardBroadcast(nightwave, {
      ...deps,
      Embed: embeds.Nightwave,
      type: 'nightwave',
      claimId: 'nightwave',
      snapshotIds: nightwave.activeChallenges.map((challenge) => challenge.id),
    });
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
    return this.#standardBroadcast(steelPath, {
      Embed: embeds.SteelPath,
      type,
      claimId: asId(steelPath, 'steelpath'),
      ...deps,
    });
  }

  async #sendStreams(newStreams, deps) {
    return this.#sendNews(newStreams, deps, 'streams');
  }

  async #sendSyndicates(newSyndicates, deps) {
    if (!newSyndicates || !newSyndicates[0]) return;
    return Promise.mapSeries(syndicates, async ({ key, display, prefix, notifiable }) => {
      if (!notifiable) return undefined;

      const eKey = `${prefix || ''}${key}`;
      const snapshotIds = newSyndicates.filter((mission) => mission.syndicate === display).map((mission) => mission.id);

      return this.#standardBroadcast(newSyndicates, {
        ...deps,
        asUnit: true,
        type: eKey,
        claimId: trackableClaimId(eKey, newSyndicates[0].id),
        snapshotIds,
        buildEmbed: () => new embeds.Syndicate(newSyndicates, { syndicate: display, ...deps }),
        shouldBroadcast: (embed) => {
          const invalidField = embed.fields?.[0]?.name === 'No such Syndicate';
          return (
            embed.description &&
            embed.description.length > 0 &&
            embed.description !== 'No such Syndicate' &&
            !invalidField
          );
        },
      });
    });
  }

  async #sendTweets(newTweets, deps) {
    return Promise.mapSeries(newTweets, async (t) =>
      this.#standardBroadcast(t, {
        Embed: embeds.Tweet,
        type: t.id,
        claimId: t.uniqueId,
        ...deps,
      })
    );
  }

  async #sendUpdates(newNews, deps) {
    return this.#sendNews(newNews, deps, 'updates');
  }

  async #sendSentientOutposts(outpost, deps) {
    if (outpost.mission) {
      return this.#standardBroadcast(outpost, { Embed: embeds.Outposts, type: 'outposts', ...deps });
    }
  }
}
