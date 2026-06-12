import type Database from '#shared/settings/Database';
import type { TrackingOptions } from '#shared/settings/database/repositories/TrackingRepository';
import { enqueueWorkerCacheRefresh } from '#shared/utilities/enqueueWorkerCacheRefresh';

type GuildRef = { id: string };

export default class PingSettingsService {
  constructor(private readonly settings: Database) {}

  async listPings(guild: GuildRef) {
    return this.settings.notifications.getPingsForGuild(guild);
  }

  async addPings(guildId: string, guild: GuildRef, targets: TrackingOptions, text: string) {
    await this.settings.notifications.addPings(guild, targets, text);
    await enqueueWorkerCacheRefresh(this.settings, guildId, null, {
      refreshGuild: false,
      refreshPings: true,
    });
  }

  async removePing(guildId: string, guild: GuildRef, target: string) {
    await this.settings.notifications.removePing(guild, target);
    await enqueueWorkerCacheRefresh(this.settings, guildId, null, {
      refreshGuild: false,
      refreshPings: true,
    });
  }

  async clearPings(guildId: string) {
    await this.settings.notifications.removePings(guildId);
    await enqueueWorkerCacheRefresh(this.settings, guildId, null, {
      refreshGuild: false,
      refreshPings: true,
    });
  }
}
