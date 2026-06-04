import { ChannelType, type Guild } from 'discord.js';
import SQL from 'sql-template-strings';

import type { DatabaseDeps, GuildChannelHost } from '../DatabaseDeps';

type ChannelRef = { id: string; type?: ChannelType; guild?: { id: string } };

export type StoredWebhook = {
  id?: string;
  token?: string;
  name?: string;
  avatar?: string;
};

/**
 * Channel and guild-scoped key/value settings (settings table + webhooks).
 * Mirrors the `settings` slash command domain.
 */
export default class ChannelSettingsRepository {
  constructor(
    private readonly deps: DatabaseDeps,
    private readonly guildChannels: GuildChannelHost
  ) {}

  async getGuilds(): Promise<Record<string, { id: string; channels: string[] }>> {
    const [rows] = (await this.deps.query(SQL`select id, guild_id from channels;`)) ?? [[]];
    const guilds: Record<string, { id: string; channels: string[] }> = {};
    rows.forEach((row: { guild_id: string; id: string }) => {
      if (!guilds[row.guild_id]) {
        guilds[row.guild_id] = {
          id: row.guild_id,
          channels: [],
        };
      }
      guilds[row.guild_id].channels.push(row.id);
    });
    return guilds;
  }

  async getGuildSetting(guild: Guild, setting: string): Promise<unknown> {
    if (guild) {
      const query = SQL`SELECT val FROM settings, channels WHERE channel_id=channels.id and channels.guild_id=${guild.id} and settings.setting=${setting}`;
      const [rows] = (await this.deps.query(query)) ?? [[]];
      if (!rows.length) {
        await this.setGuildSetting(guild, setting, this.deps.defaults[setting]);
        return this.deps.defaults[setting];
      }
      await this.setGuildSetting(guild, setting, rows[0].val);
      return rows[0].val;
    }
    return this.deps.defaults[setting];
  }

  private async checkWebhookAndReturn(channel: ChannelRef, setting: string) {
    if (!/webhook/.test(setting)) {
      await this.setSetting(channel, setting, this.deps.defaults[setting]);
      return this.deps.defaults[setting];
    }
    return undefined;
  }

  async getSettings(channel: ChannelRef | string, settings: string[]): Promise<Record<string, string>> {
    if (typeof channel === 'string' || !channel.id) {
      channel = { id: typeof channel === 'string' ? channel : String(channel) };
    }
    const query = SQL`SELECT val, setting FROM settings WHERE settings.channel_id = ${channel.id} and settings.setting in (${settings})`;
    const [rows] = (await this.deps.query(query)) ?? [[]];
    if (!rows.length) {
      return {};
    }
    const values: Record<string, string> = {};
    rows.forEach((row: { setting: string; val: string }) => {
      values[row.setting] = row.val;
    });
    return values;
  }

  /** @deprecated prefer {@link getSettings} */
  getChannelSettings = this.getSettings;

  async getSetting(channel: ChannelRef | string | null | undefined, setting: string): Promise<string | undefined> {
    if (channel) {
      if (typeof channel === 'string' || !channel.id) {
        channel = { id: typeof channel === 'string' ? channel : String(channel) };
      }
      const query = SQL`SELECT val FROM settings WHERE settings.channel_id=${channel.id} and settings.setting=${setting};`;
      const [rows] = (await this.deps.query(query)) ?? [[]];
      if (!rows.length) {
        if (channel.type === ChannelType.GuildText) {
          await this.guildChannels.addGuildTextChannel(channel);
        } else {
          await this.guildChannels.addDMChannel(channel);
        }
        return (await this.checkWebhookAndReturn(channel, setting)) as string | undefined;
      }
      return rows[0].val;
    }
    return undefined;
  }

  /** @deprecated prefer {@link getSetting} */
  getChannelSetting = this.getSetting;

  async setWebhook(channel: ChannelRef | string, webhook: StoredWebhook) {
    if (typeof channel === 'string' || !channel.id) {
      channel = { id: typeof channel === 'string' ? channel : String(channel) };
    }
    if (webhook.id && webhook.token && webhook.name && webhook.avatar) {
      const query = SQL`INSERT INTO settings (channel_id, setting, val)
      VALUES (${channel.id}, 'webhookId', ${webhook.id}),
      (${channel.id}, 'webhookToken', ${webhook.token}),
      (${channel.id}, 'webhookName', ${webhook.name}),
      (${channel.id}, 'webhookAvatar', ${webhook.avatar})
      ON DUPLICATE KEY UPDATE
        val = Values(val)`;

      return this.deps.query(query);
    }
    return false;
  }

  /** @deprecated prefer {@link setWebhook} */
  setChannelWebhook = this.setWebhook;

  async getWebhook(channel: ChannelRef | string): Promise<StoredWebhook | undefined> {
    if (typeof channel === 'string' || !channel.id) {
      channel = { id: typeof channel === 'string' ? channel : String(channel) };
    }
    const query = SQL`SELECT setting, val FROM settings where channel_id = ${channel.id} and setting in ('webhookId', 'webhookToken', 'webhookName', 'webhookAvatar');`;
    const [rows] = (await this.deps.query(query)) ?? [[]];
    let webhook: StoredWebhook = {};
    if (rows) {
      (rows as Array<{ setting: string; val: string }>)
        .map((row) => ({
          setting: row.setting,
          value: row.val,
        }))
        .forEach((row: { setting: string; value: string }) => {
          if (row.setting.indexOf('webhook') > -1) {
            webhook[`${row.setting.replace('webhook', '').toLowerCase()}`] = row.value;
          }
        });

      if (!webhook.avatar) {
        webhook.avatar = this.deps.defaults.avatar as string | undefined;
      }
      if (!webhook.name) {
        webhook.name = this.deps.defaults.username as string | undefined;
      }
      if (!(webhook.id && webhook.token)) {
        webhook = undefined;
      }
    } else {
      webhook = undefined;
    }
    return webhook;
  }

  /** @deprecated prefer {@link getWebhook} */
  getChannelWebhook = this.getWebhook;

  async setSetting(channel: ChannelRef | string, setting: string, value: unknown) {
    if (typeof setting === 'undefined' || typeof value === 'undefined') return false;
    if (typeof channel === 'string' || !channel?.id) {
      channel = { id: typeof channel === 'string' ? channel : String(channel) };
    }
    const query = SQL`INSERT IGNORE INTO settings (channel_id, setting, val) VALUE (${channel.id},${setting},${value}) ON DUPLICATE KEY UPDATE val=${value};`;
    return this.deps.query(query);
  }

  /** @deprecated prefer {@link setSetting} */
  setChannelSetting = this.setSetting;

  async deleteSetting(channel: ChannelRef | string, setting: string) {
    if (typeof setting === 'undefined') return false;
    if (typeof channel === 'string' || !channel.id) {
      channel = { id: typeof channel === 'string' ? channel : String(channel) };
    }
    const query = SQL`DELETE FROM settings where channel_id = ${channel.id} and setting=${setting};`;
    return this.deps.query(query);
  }

  /** @deprecated prefer {@link deleteSetting} */
  deleteChannelSetting = this.deleteSetting;

  async setGuildSetting(guild: Guild, setting: string, value: unknown) {
    if (typeof setting === 'undefined' || typeof value === 'undefined') return false;
    const promises: Promise<unknown>[] = [];
    guild.channels.cache.forEach((channel) => {
      promises.push(this.setSetting(channel, setting, value));
    });
    return Promise.all(promises);
  }

  async deleteGuildSetting(guild: Guild, setting: string) {
    const promises: Promise<unknown>[] = [];
    guild.channels.cache.forEach((channel) => {
      promises.push(this.deleteSetting(channel, setting));
    });
    return Promise.all(promises);
  }

  async removeSettings(channelId: string) {
    const query = SQL`DELETE FROM settings WHERE settings.channel_id=${channelId};`;
    return this.deps.query(query);
  }

  async deleteWebhooksForChannel(channelId: string) {
    const query = SQL`DELETE FROM settings WHERE channel_id=${channelId} and setting in ("webhookToken", "webhookId", "webhookAvatar", "webhookName");`;
    return this.deps.query(query);
  }
}
