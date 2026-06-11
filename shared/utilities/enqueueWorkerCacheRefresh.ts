import type Database from '#shared/settings/Database';

type ChannelRef = { id: string; guild?: { id: string } };

export type WorkerCacheRefreshOptions = {
  trackableTypes?: string[];
  refreshGuild?: boolean;
  refreshPings?: boolean;
};

/** Queue per-guild worker cache patches after tracking changes. */
export async function enqueueWorkerCacheRefresh(
  settings: Database,
  guildId: string,
  channel?: ChannelRef | null,
  { trackableTypes = [], refreshGuild = true, refreshPings = false }: WorkerCacheRefreshOptions = {}
) {
  if (!guildId) return;

  const uniqueTypes = [...new Set(trackableTypes.filter(Boolean))];
  if (uniqueTypes.length) {
    if (!channel?.id) return;
    const language =
      (await settings.channels.getSetting(channel, 'language')) || settings.defaults.language || 'en';
    const locale = String(language).substring(0, 2);
    await settings.workerCache.enqueueTrackables(guildId, locale, uniqueTypes);
  }

  if (refreshGuild) {
    await settings.workerCache.enqueueGuild(guildId);
  }

  if (refreshPings) {
    await settings.workerCache.enqueuePings(guildId);
  }
}

/** @deprecated use {@link enqueueWorkerCacheRefresh} */
export const enqueueTrackablesCacheRefresh = async (
  settings: Database,
  guildId: string,
  channel: ChannelRef,
  types: string[]
) => enqueueWorkerCacheRefresh(settings, guildId, channel, { trackableTypes: types, refreshGuild: true });
