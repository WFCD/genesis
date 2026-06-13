import type { ThreadChannel } from 'discord.js';

import type Database from '#shared/settings/Database';
import { enqueueWorkerCacheRefresh } from '#shared/utilities/enqueueWorkerCacheRefresh';

type ChannelRef = { id: string; guild?: { id: string } };
type ThreadRef = Pick<ThreadChannel, 'id'> | undefined;

export type TrackingPatch = {
  items?: string[];
  events?: string[];
  replace?: boolean;
};

export default class TrackingSettingsService {
  constructor(private readonly settings: Database) {}

  async getTracking(channel: ChannelRef, thread?: ThreadRef) {
    const threadArg = thread as ThreadChannel | undefined;
    const [items, events] = await Promise.all([
      this.settings.tracking.getTrackedItems(channel, threadArg),
      this.settings.tracking.getTrackedEventTypes(channel, threadArg),
    ]);
    return { items, events };
  }

  async setTracking(
    guildId: string,
    channel: ChannelRef,
    thread: ThreadRef,
    { items = [], events = [], replace = true }: TrackingPatch
  ) {
    const threadArg = thread as ThreadChannel | undefined;
    if (replace) {
      await this.settings.tracking.setTrackables(channel, { items, events, thread: threadArg });
    } else {
      const current = await this.getTracking(channel, thread);
      await this.settings.tracking.setTrackables(channel, {
        items: [...new Set([...current.items, ...items])],
        events: [...new Set([...current.events, ...events])],
        thread: threadArg,
      });
    }

    await enqueueWorkerCacheRefresh(this.settings, guildId, channel, {
      trackableTypes: [...events, ...items],
      refreshGuild: true,
      refreshPings: false,
    });
  }

  async stopTracking(channel: ChannelRef, _thread?: ThreadRef) {
    await this.settings.tracking.stopTracking(channel);
    const guildId = channel.guild?.id;
    if (guildId) {
      await enqueueWorkerCacheRefresh(this.settings, guildId, channel, {
        refreshGuild: true,
        refreshPings: false,
      });
    }
  }
}
