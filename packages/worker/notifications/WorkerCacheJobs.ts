// @ts-nocheck -- incremental TS migration; worker notification runtime
import { cachedEvents } from '#shared/resources';
import { getExpectedWorkerCount, getWorkerId } from '#shared/settings/workerCluster';
import { isSharedScope } from '#shared/settings/database/repositories/WorkerCacheRepository';
import logger from '#shared/utilities/Logger';

/**
 * Patch cached trackable channel lists for one guild without full hydrateQueries.
 */
export async function patchGuildTrackables({ settings, workerCache, guildId, locale, types, platforms }) {
  const guildChannels = await settings.workerCache.getGuildChannelIds(guildId);
  if (!guildChannels.length) return 0;

  const guildChannelSet = new Set(guildChannels);
  const typesToPatch = types?.length ? types.filter((type) => cachedEvents.includes(type)) : cachedEvents;

  if (!typesToPatch.length) return 0;

  let patched = 0;
  for (const platform of platforms) {
    for (const type of typesToPatch) {
      const key = `${type}:${platform}:${locale}`;
      const current = workerCache.getKey(key) || [];
      const withoutGuild = current.filter(({ channelId }) => !guildChannelSet.has(String(channelId)));
      const fresh = await settings.getAgnosticNotifications({ type, platform, locale });
      const guildSlice = (fresh || []).filter(({ channelId }) => guildChannelSet.has(String(channelId)));
      workerCache.setKey(key, [...withoutGuild, ...guildSlice]);
      patched += 1;
    }
  }
  workerCache.save(true);
  return patched;
}

export async function patchGuildPings({ settings, workerCache, guildId }) {
  const pings = { ...(workerCache.getKey('pings') || {}) };
  Object.keys(pings).forEach((key) => {
    if (key.startsWith(`${guildId}:`)) {
      delete pings[key];
    }
  });

  const slice = await settings.notifications.getGuildPingCacheSlice(guildId);
  Object.assign(pings, slice);
  workerCache.setKey('pings', pings);
  workerCache.save(true);
  return Object.keys(slice).length;
}

export async function patchGuildGuild({ settings, workerCache, guildId }) {
  const guilds = { ...(workerCache.getKey('guilds') || {}) };
  const channelIds = await settings.workerCache.getGuildChannelIds(guildId);
  guilds[guildId] = { id: guildId, channels: channelIds };
  delete guilds.null;
  workerCache.setKey('guilds', guilds);
  workerCache.save(true);
  return 1;
}

async function finishJob(settings, job, workerId) {
  if (isSharedScope(job.scope)) {
    await settings.workerCache.ackJob(job.id, workerId);
    const acks = await settings.workerCache.countAcks(job.id);
    if (acks >= getExpectedWorkerCount()) {
      await settings.workerCache.deleteJob(job.id);
    }
    return;
  }

  await settings.workerCache.deleteJob(job.id);
}

export async function processWorkerCacheJobs({ settings, workerCache, locales, platforms, workerId }) {
  const jobs = await settings.workerCache.fetchPendingJobs(locales, workerId);
  if (!jobs.length) return;

  for (const job of jobs) {
    try {
      let detail = '';
      if (job.scope === 'trackables') {
        const patched = await patchGuildTrackables({
          settings,
          workerCache,
          guildId: job.guild_id,
          locale: job.locale,
          types: job.types,
          platforms,
        });
        detail = `patched ${patched} trackable keys`;
      } else if (job.scope === 'pings') {
        const patched = await patchGuildPings({ settings, workerCache, guildId: job.guild_id });
        detail = `patched ${patched} ping keys`;
      } else if (job.scope === 'guild') {
        await patchGuildGuild({ settings, workerCache, guildId: job.guild_id });
        detail = 'patched guild map';
      }

      logger.info(`worker cache job ${job.id}: guild ${job.guild_id} ${job.scope} ${detail}`, 'DB');
      await finishJob(settings, job, workerId);
    } catch (e) {
      logger.error(e, `worker cache job ${job.id} failed`);
    }
  }
}

export { getWorkerId };
