import type { Guild } from 'discord.js';
import SQL from 'sql-template-strings';

import { pingables } from '#shared/resources/index';
import logger from '#shared/utilities/Logger';

import type { DatabaseDeps } from '../DatabaseDeps';

import type { TrackingOptions } from './TrackingRepository';

export type NotificationTarget = {
  channelId: string;
  threadId?: string | number;
};

export interface NotificationsDeps extends DatabaseDeps {
  scope: string;
  clusterId: string | number;
  bot?: {
    shardTotal?: string | number;
    shards?: number[];
  };
}

type GuildRef = Guild | { id: string };

/**
 * Ping text and notification routing for tracked events/items.
 * Mirrors tracking ping behavior + worker broadcast queries.
 */
export default class NotificationsRepository {
  constructor(private readonly deps: NotificationsDeps) {}

  async addPings(guild: GuildRef, opts: TrackingOptions, text: string) {
    const query = SQL`INSERT INTO pings VALUES `;
    const combined = (opts.events ?? []).concat(opts.items ?? []);
    combined.forEach((eventOrItem, index) => {
      query.append(SQL`(${guild.id}, ${eventOrItem}, ${text})`).append(index !== combined.length - 1 ? ',' : '');
    });
    query.append(SQL`ON DUPLICATE KEY UPDATE text = ${text};`);
    return this.deps.query(query);
  }

  async getPing(guild: GuildRef | string | null | undefined, itemsOrTypes: string[]) {
    if (!guild) {
      return undefined;
    }

    let guildRef = guild as GuildRef & { channels?: unknown };
    if ('channels' in guildRef && guildRef.channels) {
      delete guildRef.channels;
    }

    if (!guildRef.id) {
      guildRef = { id: guild as string };
    }
    try {
      const query = SQL`SELECT text FROM pings WHERE guild_id=${guildRef.id} AND item_or_type in (${itemsOrTypes})`;
      const res = await this.deps.query(query);
      if (!res?.[0]?.length) return '';
      return (res[0] as Array<{ text: string }>).map((result) => result.text).join(', ');
    } catch (e) {
      logger.error(e);
      return '';
    }
  }

  async getAllPings() {
    let globalPings: Record<string, string> = {};
    await Promise.all(
      pingables.map(async (plist) => {
        const plistPings = await this.getGroupPings(plist);
        globalPings = {
          ...globalPings,
          ...plistPings,
        };
      })
    );
    return globalPings;
  }

  async getGroupPings(plist: string) {
    const pings: Record<string, string> = {};
    const query = SQL`SELECT guild_id, GROUP_CONCAT(text SEPARATOR ',') as ping
      FROM pings
      WHERE item_or_type in (${plist.split(',')})
      GROUP by guild_id
      ORDER by item_or_type asc`;
    const res = await this.deps.query(query);
    const [rows] = res ?? [[]];

    if (rows) {
      (rows as Array<{ guild_id: string; ping: string }>).forEach((row) => {
        const id = `${row.guild_id}:${plist}`;
        pings[id] = row.ping;
      });
    }

    return pings;
  }

  async getPingsForGuild(guild: GuildRef) {
    if (guild) {
      const query = SQL`SELECT item_or_type, text FROM pings WHERE guild_id=${guild.id}`;
      const [rows] = (await this.deps.query(query)) ?? [[]];

      return rows.length
        ? (rows as Array<{ text: string; item_or_type: string }>).map((result) => ({
            text: result.text,
            thing: result.item_or_type,
          }))
        : [];
    }
    return [];
  }

  async removePing(guild: GuildRef, itemOrType: string) {
    if (guild) {
      const query = SQL`DELETE FROM pings WHERE guild_id = ${guild.id} AND item_or_type = ${itemOrType};`;
      return this.deps.query(query);
    }
    return false;
  }

  async getNotifications(type: string, platform: string, items?: string[]) {
    try {
      const query = SQL`SELECT DISTINCT channels.id as channelId
          FROM type_notifications`
        .append(
          items && items.length
            ? SQL` INNER JOIN item_notifications ON type_notifications.channel_id = item_notifications.channel_id`
            : SQL``
        )
        .append(SQL` INNER JOIN channels ON channels.id = type_notifications.channel_id`)
        .append(SQL` INNER JOIN settings ON channels.id = settings.channel_id`)
        .append(
          SQL` WHERE type_notifications.type = ${String(type)}
          AND MOD(IFNULL(channels.guild_id, 0) >> 22, ${this.deps.bot?.shardTotal}) in (${this.deps.bot?.shards})
          AND settings.setting = "platform"  AND (settings.val = ${platform || 'pc'} OR settings.val IS NULL) `
        )
        .append(
          items && items.length
            ? SQL` AND item_notifications.item IN (${items})
          AND item_notifications.channel_id = settings.channel_id;`
            : SQL`;`
        );
      return (await this.deps.query(query))?.[0] ?? [];
    } catch (e) {
      this.deps.logger?.error(e);
      return [];
    }
  }

  async getAgnosticNotifications({
    type,
    platform,
    items,
    locale,
  }: {
    type: string;
    platform: string;
    items?: string[];
    locale: string;
  }): Promise<NotificationTarget[]> {
    if (this.deps.scope.toLowerCase() !== 'worker') {
      return this.getNotifications(type, platform, items) as Promise<NotificationTarget[]>;
    }
    try {
      const query = SQL`SELECT DISTINCT
            channels.id as channelId,
            type_notifications.thread_id as typeThreadId`
        .append(
          items && items.length
            ? SQL`, 
            item_notifications.thread_id as itemThreadId`
            : SQL``
        )
        .append(
          SQL`
          FROM type_notifications
        `
        )
        .append(
          items && items.length
            ? SQL` INNER JOIN item_notifications ON type_notifications.channel_id = item_notifications.channel_id`
            : SQL``
        )
        .append(
          SQL`
          INNER JOIN channels ON channels.id = type_notifications.channel_id
          INNER JOIN settings as s1 ON channels.id = s1.channel_id
            AND s1.setting = "platform"  AND (s1.val = ${platform || 'pc'} OR s1.val IS NULL)
          INNER JOIN settings s2 on channels.id = s2.channel_id
            AND s2.setting = "language" AND s2.val = ${locale}
          INNER JOIN settings as ws1 ON channels.id = ws1.channel_id
            AND ws1.setting = "webhookToken" AND ws1.val IS NOT NULL
          INNER JOIN settings as ws2 ON channels.id = ws2.channel_id
            AND ws2.setting = "webhookId" AND ws2.val IS NOT NULL
          INNER JOIN settings as ws3 ON channels.id = ws3.channel_id
            AND ws3.setting = "webhookAvatar" AND ws3.val IS NOT NULL
          INNER JOIN settings as ws4 ON channels.id = ws4.channel_id
            AND ws4.setting = "webhookName" AND ws4.val IS NOT NULL `
        )
        .append(SQL` WHERE type_notifications.type = ${String(type)} `)
        .append(
          items && items.length
            ? SQL` AND item_notifications.item IN (${items})
          AND item_notifications.channel_id = channels.id;`
            : SQL`;`
        );
      const rows = (await this.deps.query(query))?.[0] as
        | Array<{ channelId: string; typeThreadId?: string; itemThreadId?: string }>
        | undefined;

      return (rows ?? [])
        .map((o) => ({
          channelId: o.channelId,
          threadId: o.typeThreadId || o.itemThreadId,
        }))
        .filter((o) => o.channelId);
    } catch (e) {
      this.deps.logger?.error(e);
      return [];
    }
  }

  async removePings(guildId: string) {
    const query = SQL`DELETE FROM pings WHERE guild_id = ${guildId}`;
    return this.deps.query(query);
  }

  async setNotifiedIds(platform: string, notifiedIds: string[]) {
    const query = SQL`INSERT INTO notified_ids VALUES
      (${this.deps.clusterId}, ${platform}, JSON_ARRAY(${notifiedIds}))
      ON DUPLICATE KEY UPDATE id_list = JSON_ARRAY(${notifiedIds});`;
    return this.deps.query(query);
  }

  async getNotifiedIds(platform: string) {
    const query = SQL`SELECT id_list
      FROM notified_ids
      WHERE shard_id=${this.deps.clusterId} AND platform=${platform};`;
    const [rows] = (await this.deps.query(query)) ?? [[]];
    return rows.length ? rows[0].id_list : [];
  }
}
