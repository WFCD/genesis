import type { Guild } from 'discord.js';

import type Database from '#shared/settings/Database';
import { ROOM_SETTING_KEYS } from '#shared/settings/database/repositories/ChannelSettingsRepository';

type GuildRef = { id: string };

const asGuild = (guild: GuildRef) => guild as unknown as Guild;

export default class RoomSettingsService {
  constructor(private readonly settings: Database) {}

  async getRoomSettings(guild: GuildRef) {
    const settings: Record<string, string> = {};
    for (const key of ROOM_SETTING_KEYS) {
      const value = await this.settings.channels.getGuildSetting(asGuild(guild), key);
      if (value !== undefined && value !== null) {
        settings[key] = String(value);
      }
    }
    return settings;
  }

  async patchRoomSettings(guild: GuildRef, patch: Record<string, string | boolean | null | undefined>) {
    for (const [key, value] of Object.entries(patch)) {
      if (value === undefined || !(ROOM_SETTING_KEYS as readonly string[]).includes(key)) continue;
      if (value === null) {
        await this.settings.channels.deleteGuildSetting(asGuild(guild), key);
      } else {
        const stored = typeof value === 'boolean' ? (value ? '1' : '0') : String(value);
        await this.settings.channels.setGuildSetting(asGuild(guild), key, stored);
      }
    }
  }
}
