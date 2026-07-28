import SQL from 'sql-template-strings';

import type { DatabaseDeps } from '#shared/settings/database/DatabaseDeps';

export type NotificationIssue = {
  id: number;
  guildId: string;
  channelId: string | null;
  threadId: string;
  code: string;
  message: string;
  count: number;
  firstSeenAt: Date;
  lastSeenAt: Date;
};

export type NotificationIssueSummary = {
  guildId: string;
  count: number;
};

export type GuildNotificationPause = {
  guildId: string;
  pausedUntil: Date;
  reason: string;
  strike: number;
};

const PAUSE_MS = 24 * 60 * 60 * 1000;

type IssueRow = {
  id: number;
  guild_id: string;
  channel_id: string | null;
  thread_id: string;
  code: string;
  message: string;
  count: number;
  first_seen_at: Date;
  last_seen_at: Date;
};

const mapIssue = (row: IssueRow): NotificationIssue => ({
  id: Number(row.id),
  guildId: String(row.guild_id),
  channelId: row.channel_id == null ? null : String(row.channel_id),
  threadId: String(row.thread_id ?? 0),
  code: row.code,
  message: row.message,
  count: Number(row.count),
  firstSeenAt: row.first_seen_at,
  lastSeenAt: row.last_seen_at,
});

/**
 * Aggregated delivery failures for the dashboard, plus guild-level send pauses.
 */
export default class NotificationIssuesRepository {
  constructor(private readonly deps: DatabaseDeps) {}

  async upsertIssue(input: {
    guildId: string;
    channelId?: string | null;
    threadId?: string | number | null;
    code: string;
    message: string;
  }): Promise<void> {
    const channelId = input.channelId ?? null;
    const threadId = input.threadId ?? 0;
    const message = input.message.slice(0, 512);
    await this.deps.query(SQL`
      INSERT INTO notification_issues (guild_id, channel_id, thread_id, code, message, count)
      VALUES (${input.guildId}, ${channelId}, ${threadId}, ${input.code}, ${message}, 1)
      ON DUPLICATE KEY UPDATE
        count = count + 1,
        message = VALUES(message),
        last_seen_at = CURRENT_TIMESTAMP
    `);
  }

  async listForGuild(guildId: string): Promise<NotificationIssue[]> {
    const [rows] = (await this.deps.query(SQL`
      SELECT id, guild_id, channel_id, thread_id, code, message, count, first_seen_at, last_seen_at
      FROM notification_issues
      WHERE guild_id = ${guildId}
      ORDER BY last_seen_at DESC
    `)) ?? [[]];
    return (rows as IssueRow[]).map(mapIssue);
  }

  async countForGuild(guildId: string): Promise<number> {
    const [rows] = (await this.deps.query(SQL`
      SELECT COALESCE(SUM(count), 0) AS total
      FROM notification_issues
      WHERE guild_id = ${guildId}
    `)) ?? [[]];
    return Number((rows as Array<{ total: number }>)?.[0]?.total ?? 0);
  }

  async summarizeForGuilds(guildIds: string[]): Promise<NotificationIssueSummary[]> {
    const unique = [...new Set(guildIds.map(String).filter(Boolean))];
    if (!unique.length) return [];
    const query = SQL`
      SELECT guild_id, COALESCE(SUM(count), 0) AS count
      FROM notification_issues
      WHERE guild_id IN (
    `;
    unique.forEach((id, index) => {
      query.append(SQL`${id}`).append(index !== unique.length - 1 ? ',' : '');
    });
    query.append(SQL`)
      GROUP BY guild_id
      HAVING count > 0
    `);
    const [rows] = (await this.deps.query(query)) ?? [[]];
    return (rows as Array<{ guild_id: string; count: number }>).map((row) => ({
      guildId: String(row.guild_id),
      count: Number(row.count),
    }));
  }

  async getGuildIdForChannel(channelId: string): Promise<string | undefined> {
    const [rows] = (await this.deps.query(SQL`
      SELECT guild_id FROM channels WHERE id = ${channelId} LIMIT 1
    `)) ?? [[]];
    const guildId = (rows as Array<{ guild_id: string | null }>)?.[0]?.guild_id;
    return guildId == null ? undefined : String(guildId);
  }

  async getPause(guildId: string): Promise<GuildNotificationPause | undefined> {
    const [rows] = (await this.deps.query(SQL`
      SELECT guild_id, paused_until, reason, strike
      FROM notification_guild_pause
      WHERE guild_id = ${guildId}
      LIMIT 1
    `)) ?? [[]];
    const row = (rows as Array<{
      guild_id: string;
      paused_until: Date;
      reason: string;
      strike: number;
    }>)?.[0];
    if (!row) return undefined;
    return {
      guildId: String(row.guild_id),
      pausedUntil: row.paused_until,
      reason: row.reason,
      strike: Number(row.strike),
    };
  }

  async isGuildPaused(guildId: string): Promise<boolean> {
    const pause = await this.getPause(guildId);
    if (!pause) return false;
    return pause.pausedUntil.getTime() > Date.now();
  }

  async pauseGuild(guildId: string, reason: string, strike = 1): Promise<void> {
    const pausedUntil = new Date(Date.now() + PAUSE_MS);
    await this.deps.query(SQL`
      INSERT INTO notification_guild_pause (guild_id, paused_until, reason, strike)
      VALUES (${guildId}, ${pausedUntil}, ${reason}, ${strike})
      ON DUPLICATE KEY UPDATE
        paused_until = VALUES(paused_until),
        reason = VALUES(reason),
        strike = VALUES(strike)
    `);
  }

  async clearPause(guildId: string): Promise<void> {
    await this.deps.query(SQL`DELETE FROM notification_guild_pause WHERE guild_id = ${guildId}`);
  }

  /**
   * Unknown-guild handling: first strike → 24h pause; after pause expires → wipe channel webhook.
   * @returns 'paused' | 'wiped' | 'skipped'
   */
  async handleUnknownGuild(input: {
    guildId: string;
    channelId: string;
    message: string;
    wipeWebhook: (channelId: string) => Promise<unknown>;
  }): Promise<'paused' | 'wiped' | 'skipped'> {
    const { guildId, channelId, message, wipeWebhook } = input;
    await this.upsertIssue({
      guildId,
      channelId,
      threadId: 0,
      code: 'unknown_guild',
      message,
    });

    const pause = await this.getPause(guildId);
    const now = Date.now();
    if (!pause || pause.pausedUntil.getTime() > now) {
      if (!pause) {
        await this.pauseGuild(guildId, 'unknown_guild', 1);
      }
      return pause && pause.pausedUntil.getTime() > now ? 'skipped' : 'paused';
    }

    // Pause expired and failure recurred → wipe webhooks for this channel.
    await wipeWebhook(channelId);
    await this.clearPause(guildId);
    return 'wiped';
  }
}
