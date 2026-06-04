import { ChannelType, type Client, type Guild } from 'discord.js';
import Promise from 'bluebird';
import SQL from 'sql-template-strings';

import integrations from '#shared/settings/integrations';
import schema from '#shared/settings/schema';

import type { DatabaseDeps } from '../DatabaseDeps';

type GuildRef = Guild | { id: string; available?: boolean; channels?: { cache?: Map<string, unknown> } };
type ChannelRef = { id: string; type?: ChannelType; guild?: { id: string } };

export interface GuildCleanupHost {
  removeChannelPermissions?(channelId: string): Promise<unknown>;
  removeItemNotifications?(channelId: string): Promise<unknown>;
  removeSettings?(channelId: string): Promise<unknown>;
  removePrivateChannels?(guildId: string): Promise<unknown>;
  removeGuildPermissions?(guildId: string): Promise<unknown>;
  removePings?(guildId: string): Promise<unknown>;
  removeGuildCustomCommands?(guildId: string): Promise<unknown>;
  deleteGuildRatio?(guild: GuildRef): Promise<unknown>;
}

/**
 * Guild/channel lifecycle queries previously owned by DBMQueries mixin.
 * Covers schema bootstrapping, guild/channel registration, and guild teardown.
 */
export default class GuildRepository {
  constructor(
    private readonly deps: DatabaseDeps,
    private readonly cleanupHost?: GuildCleanupHost
  ) {}

  async createSchema() {
    try {
      await Promise.mapSeries(schema, (q) => this.deps.query(q));
      return Promise.mapSeries(integrations, (integration) => integration(this.deps));
    } catch (e) {
      this.deps.logger?.fatal(e);
      return undefined;
    }
  }

  async ensureData(client: Client) {
    const promises: Array<Promise<unknown>> = [];
    client.guilds.cache.forEach((guild) => {
      if (guild.channels.cache.size) {
        promises.push(this.addGuild(guild) as Promise<unknown>);
      }
    });
    await Promise.all(promises);
  }

  addGuild(guild: GuildRef) {
    if (!guild?.id || guild.available === false) return undefined;
    const channelCache = guild.channels?.cache;
    if (!channelCache) return undefined;

    const channelIds = Array.from(channelCache.values())
      .filter((channel) => {
        const typed = channel as { type?: ChannelType };
        return typed.type === ChannelType.GuildText;
      })
      .map((channel) => (channel as { id: string }).id)
      .filter(Boolean);

    if (!channelIds.length) return undefined;

    const query = SQL`INSERT IGNORE INTO channels (id, guild_id) VALUES `;
    channelIds.forEach((id, index) => {
      query.append(SQL`(${id}, ${guild.id})`).append(index !== channelIds.length - 1 ? ',' : ';');
    });

    return this.deps.query(query);
  }

  async addGuildTextChannel(channel: ChannelRef) {
    const query = SQL`INSERT INTO channels (id, guild_id)
      VALUES (${channel.id}, ${channel.guild?.id})
      ON DUPLICATE KEY UPDATE
        id=${channel.id},
        guild_id=${channel.guild?.id};`;
    return this.deps.query(query);
  }

  async addDMChannel(channel: Pick<ChannelRef, 'id'>) {
    const query = SQL`INSERT IGNORE INTO channels (id) VALUES (${channel.id});`;
    return this.deps.query(query);
  }

  async deleteChannel(channel: Pick<ChannelRef, 'id'>) {
    const query = SQL`DELETE FROM channels WHERE id = ${channel.id};`;
    return this.deps.query(query);
  }

  async removeGuild(guild: GuildRef) {
    if (!guild?.id || guild.available === false) return false;

    const query = SQL`DELETE FROM channels WHERE guild_id = ${guild.id}`;
    await this.deps.query(query);

    const results: Array<Promise<unknown> | undefined> = [];
    const channels = guild.channels?.cache;
    if (channels) {
      channels.forEach((channel, channelId) => {
        results.push(this.cleanupHost?.removeChannelPermissions?.(channelId));
        results.push(this.cleanupHost?.removeItemNotifications?.(channelId));
        results.push(this.cleanupHost?.removeSettings?.(channelId));
      });
    }

    results.push(this.cleanupHost?.removePrivateChannels?.(guild.id));
    results.push(this.cleanupHost?.removeGuildPermissions?.(guild.id));
    results.push(this.cleanupHost?.removePings?.(guild.id));
    results.push(this.cleanupHost?.removeGuildCustomCommands?.(guild.id));
    results.push(this.cleanupHost?.deleteGuildRatio?.(guild));

    return Promise.all(results.filter(Boolean) as Array<Promise<unknown>>);
  }

  async checkUpdateChannel(channel: ChannelRef) {
    if (channel.type !== ChannelType.GuildText) return;

    const query = SQL`SELECT id as channelId, guild_id as resultGuildId
      FROM channels
      WHERE id = ${channel.id}`;
    const [rows] = (await this.deps.query(query)) ?? [[]];
    const found = (rows as Array<{ channelId: string; resultGuildId: string }>).find(
      ({ channelId, resultGuildId }) => channelId === channel.id && resultGuildId === channel.guild?.id
    );

    if (!found) {
      await this.addGuildTextChannel(channel);
    }
  }
}
