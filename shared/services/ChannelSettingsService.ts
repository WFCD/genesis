import type { Guild } from 'discord.js';

import type Database from '#shared/settings/Database';
import { GUILD_LEVEL_CHANNEL_SETTINGS } from '#shared/settings/database/repositories/ChannelSettingsRepository';

type ChannelRef = { id: string; guild?: { id: string } };
type GuildRef = { id: string };

export type ChannelSettingsPatch = Record<string, string | boolean | null | undefined>;

const GUILD_LEVEL_KEYS = new Set<string>(GUILD_LEVEL_CHANNEL_SETTINGS);

const asStored = (value: string | boolean | null | undefined) => {
  if (value === null || value === undefined) return null;
  if (typeof value === 'boolean') return value ? '1' : '0';
  return String(value);
};

export default class ChannelSettingsService {
  constructor(private readonly settings: Database) {}

  async getChannelSettings(channel: ChannelRef, keys: string[], guild?: GuildRef) {
    const channelKeys = keys.filter((key) => !GUILD_LEVEL_KEYS.has(key));
    const guildKeys = keys.filter((key) => GUILD_LEVEL_KEYS.has(key));

    const settings = channelKeys.length ? await this.settings.channels.getSettings(channel, channelKeys) : {};

    if (guild && guildKeys.length) {
      for (const key of guildKeys) {
        const value = await this.settings.channels.getGuildSetting(guild as unknown as Guild, key);
        if (value !== undefined && value !== null) {
          settings[key] = String(value);
        }
      }
    }

    return settings;
  }

  async setChannelSetting(channel: ChannelRef, key: string, value: string | boolean) {
    return this.settings.channels.setSetting(channel, key, asStored(value)!);
  }

  async deleteChannelSetting(channel: ChannelRef, key: string) {
    return this.settings.channels.deleteSetting(channel, key);
  }

  async setGuildSetting(guild: GuildRef, key: string, value: string | boolean) {
    return this.settings.channels.setGuildSetting(guild as unknown as Guild, key, asStored(value)!);
  }

  async deleteGuildSetting(guild: GuildRef, key: string) {
    return this.settings.channels.deleteGuildSetting(guild as unknown as Guild, key);
  }

  async patchChannelSettings(channel: ChannelRef, guild: GuildRef | undefined, patch: ChannelSettingsPatch) {
    for (const [key, value] of Object.entries(patch)) {
      if (value === undefined) continue;
      if (value === null) {
        if (GUILD_LEVEL_KEYS.has(key) && guild) {
          await this.deleteGuildSetting(guild, key);
        } else {
          await this.deleteChannelSetting(channel, key);
        }
        continue;
      }
      if (GUILD_LEVEL_KEYS.has(key) && guild) {
        await this.setGuildSetting(guild, key, value);
      } else {
        await this.setChannelSetting(channel, key, value);
      }
    }
  }
}
