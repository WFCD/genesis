import type { Guild } from 'discord.js';
import SQL from 'sql-template-strings';

import pingables from '#shared/resources/pingables.json' with { type: 'json' };
import logger from '#shared/utilities/Logger';
import type { DatabaseDeps } from '#shared/settings/database/DatabaseDeps';

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
const normalizeIdList = (value: unknown): string[] => {
  if (Array.isArray(value)) return value.map(String);
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed.map(String) : [];
    } catch {
      return [];
    }
  }
  return [];
};

export default class NotificationsRepository {
  constructor(private readonly deps: NotificationsDeps) {}

  /** Workers share shard 0 so all locale replicas use one dedup store per platform key. */
  private notifiedShardId() {
    return this.deps.scope.toLowerCase() === 'worker' ? 0 : this.deps.clusterId;
  }

  private dedupeNotificationTargets(
    rows: Array<{ channelId: string; typeThreadId?: string | number; itemThreadId?: string | number }>
  ): NotificationTarget[] {
    const seen = new Set<string>();
    const targets: NotificationTarget[] = [];

    for (const row of rows) {
      const channelId = String(row.channelId);
      if (!channelId.length) continue;

      const threadId = row.typeThreadId ?? row.itemThreadId ?? 0;
      const key = `${channelId}:${threadId}`;
      if (seen.has(key)) continue;

      seen.add(key);
      targets.push({ channelId, threadId });
    }

    return targets;
  }

  async addPings(guild: GuildRef, opts: TrackingOptions, text: string) {
    const events = Array.isArray(opts.events) ? opts.events : [];
    const items = Array.isArray(opts.items) ? opts.items : [];
    const combined = events.concat(items);
    if (!combined.length) {
      throw new Error('No ping targets provided');
    }

    const query = SQL`INSERT INTO pings VALUES `;
    combined.forEach((eventOrItem, index) => {
      query.append(SQL`(${guild.id}, ${eventOrItem}, ${text})`).append(index !== combined.length - 1 ? ',' : '');
    });
    query.append(SQL`ON DUPLICATE KEY UPDATE text = ${text};`);
    const result = await this.deps.query(query);
    if (!result) {
      throw new Error('Failed to save ping');
    }
    return result;
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

  /** Ping cache slice for one guild (`${guildId}:${pingablesGroup}` keys). */
  async getGuildPingCacheSlice(guildId: string): Promise<Record<string, string>> {
    const slice: Record<string, string> = {};
    await Promise.all(
      pingables.map(async (plist) => {
        const query = SQL`SELECT GROUP_CONCAT(text SEPARATOR ',') AS ping
          FROM pings
          WHERE guild_id = ${guildId}
            AND item_or_type IN (${plist.split(',')})`;
        const [rows] = (await this.deps.query(query)) ?? [[]];
        const ping = (rows as Array<{ ping?: string }>)?.[0]?.ping;
        if (ping) {
          slice[`${guildId}:${plist}`] = ping;
        }
      })
    );
    return slice;
  }

  async getPingsForGuild(guild: GuildRef) {
    if (!guild?.id) return [];

    const query = SQL`SELECT item_or_type, text FROM pings WHERE guild_id=${guild.id}`;
    const [rows] = (await this.deps.query(query)) ?? [[]];
    if (!Array.isArray(rows) || !rows.length) return [];

    return (rows as Array<{ text?: string; item_or_type?: string }>).map((result) => ({
      text: String(result.text ?? ''),
      thing: String(result.item_or_type ?? ''),
    }));
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

      return this.dedupeNotificationTargets(rows ?? []);
    } catch (e) {
      this.deps.logger?.error(e);
      return [];
    }
  }

  /**
   * Atomically append ids that are not yet notified. Returns the subset that was newly claimed.
   */
  async claimNotifiedIds(platform: string, ids: string[]): Promise<string[]> {
    const unique = [...new Set(ids.filter(Boolean).map(String))];
    if (!unique.length || !this.deps.withConnection) return [];

    const shardId = this.notifiedShardId();
    const lockName = `genesis:notified:${shardId}:${platform}`;

    return this.deps.withConnection(async (query) => {
      await query(SQL`SELECT GET_LOCK(${lockName}, 5)`);
      try {
        const [rows] = (await query(
          SQL`SELECT id_list FROM notified_ids WHERE shard_id=${shardId} AND platform=${platform}`
        )) ?? [[]];
        const current = normalizeIdList((rows as Array<{ id_list?: unknown }>)?.[0]?.id_list);
        const known = new Set(current);
        const claimed = unique.filter((id) => !known.has(id));
        if (!claimed.length) return [];

        const next = [...current, ...claimed];
        await query(SQL`INSERT INTO notified_ids VALUES (${shardId}, ${platform}, JSON_ARRAY(${next}))
          ON DUPLICATE KEY UPDATE id_list = JSON_ARRAY(${next})`);
        return claimed;
      } finally {
        await query(SQL`SELECT RELEASE_LOCK(${lockName})`);
      }
    });
  }

  /**
   * Atomically record a worldstate id as notified. Returns false if another worker already claimed it.
   */
  async claimNotifiedId(platform: string, id: string): Promise<boolean> {
    const claimed = await this.claimNotifiedIds(platform, id ? [id] : []);
    return claimed.length > 0;
  }

  /**
   * Remove ids from the notified list. Used when a claim did not result in delivery.
   */
  async releaseNotifiedIds(platform: string, ids: string[]): Promise<string[]> {
    const unique = [...new Set(ids.filter(Boolean).map(String))];
    if (!unique.length || !this.deps.withConnection) return [];

    const shardId = this.notifiedShardId();
    const lockName = `genesis:notified:${shardId}:${platform}`;

    return this.deps.withConnection(async (query) => {
      await query(SQL`SELECT GET_LOCK(${lockName}, 5)`);
      try {
        const [rows] = (await query(
          SQL`SELECT id_list FROM notified_ids WHERE shard_id=${shardId} AND platform=${platform}`
        )) ?? [[]];
        const current = normalizeIdList((rows as Array<{ id_list?: unknown }>)?.[0]?.id_list);
        const release = new Set(unique);
        const released = current.filter((id) => release.has(id));
        if (!released.length) return [];

        const next = current.filter((id) => !release.has(id));
        if (!next.length) {
          await query(SQL`DELETE FROM notified_ids WHERE shard_id=${shardId} AND platform=${platform}`);
        } else {
          await query(SQL`INSERT INTO notified_ids VALUES (${shardId}, ${platform}, JSON_ARRAY(${next}))
            ON DUPLICATE KEY UPDATE id_list = JSON_ARRAY(${next})`);
        }
        return released;
      } finally {
        await query(SQL`SELECT RELEASE_LOCK(${lockName})`);
      }
    });
  }

  async removePings(guildId: string) {
    const query = SQL`DELETE FROM pings WHERE guild_id = ${guildId}`;
    return this.deps.query(query);
  }

  async setNotifiedIds(platform: string, notifiedIds: string[]) {
    const shardId = this.notifiedShardId();
    const query = SQL`INSERT INTO notified_ids VALUES
      (${shardId}, ${platform}, JSON_ARRAY(${notifiedIds}))
      ON DUPLICATE KEY UPDATE id_list = JSON_ARRAY(${notifiedIds});`;
    return this.deps.query(query);
  }

  async getNotifiedIds(platform: string) {
    const shardId = this.notifiedShardId();
    const query = SQL`SELECT id_list
      FROM notified_ids
      WHERE shard_id=${shardId} AND platform=${platform};`;
    const [rows] = (await this.deps.query(query)) ?? [[]];
    return rows.length ? normalizeIdList(rows[0].id_list) : [];
  }
}
