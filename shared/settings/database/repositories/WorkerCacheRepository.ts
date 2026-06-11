import SQL from 'sql-template-strings';

import { GLOBAL_WORKER_LOCALE } from '#shared/settings/workerCluster';

import type { DatabaseDeps } from '../DatabaseDeps';

export type WorkerCacheScope = 'trackables' | 'pings' | 'guild';

export type WorkerCacheRefreshStamp = 'pings' | 'trackables' | 'guild';

const REFRESH_SCOPES: WorkerCacheRefreshStamp[] = ['pings', 'trackables', 'guild'];

export type WorkerCacheJob = {
  id: number;
  guild_id: string;
  locale: string;
  scope: WorkerCacheScope;
  types: string[] | null;
  requested_at: Date;
};

type JobRow = {
  id: number;
  guild_id: string;
  locale: string;
  scope: WorkerCacheScope;
  types: string | string[] | null;
  requested_at: Date;
};

const parseTypes = (value: string | string[] | null | undefined): string[] | null => {
  if (value == null) return null;
  if (Array.isArray(value)) return value.length ? value : null;
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) && parsed.length ? parsed : null;
  } catch {
    return null;
  }
};

const isSharedScope = (scope: WorkerCacheScope) => scope === 'pings' || scope === 'guild';

/**
 * Per-guild worker cache refresh queue.
 * Trackables: locale-scoped, delete-on-complete by one worker.
 * Pings/guild: global locale (`''`), acked by each worker before delete.
 */
export default class WorkerCacheRepository {
  constructor(private readonly deps: DatabaseDeps) {}

  async enqueueJob(guildId: string, locale: string, scope: WorkerCacheScope, types?: string[] | null) {
    const normalizedLocale = scope === 'trackables' ? locale.substring(0, 2) : GLOBAL_WORKER_LOCALE;
    const typesJson = types?.length ? JSON.stringify(types) : null;
    const query = SQL`
      INSERT INTO worker_cache_jobs (guild_id, locale, scope, types)
      VALUES (${guildId}, ${normalizedLocale}, ${scope}, ${typesJson})
      ON DUPLICATE KEY UPDATE
        types = ${typesJson},
        requested_at = CURRENT_TIMESTAMP`;
    return this.deps.query(query);
  }

  async enqueueTrackables(guildId: string, locale: string, types?: string[] | null) {
    return this.enqueueJob(guildId, locale, 'trackables', types);
  }

  async enqueueGuild(guildId: string) {
    return this.enqueueJob(guildId, GLOBAL_WORKER_LOCALE, 'guild');
  }

  async enqueuePings(guildId: string) {
    return this.enqueueJob(guildId, GLOBAL_WORKER_LOCALE, 'pings');
  }

  async fetchPendingJobs(workerLocales: string[], workerId: string, limit = 50): Promise<WorkerCacheJob[]> {
    const locales = [...new Set([...workerLocales, GLOBAL_WORKER_LOCALE])];
    if (!locales.length) return [];

    const query = SQL`
      SELECT j.id, j.guild_id, j.locale, j.scope, j.types, j.requested_at
      FROM worker_cache_jobs j
      LEFT JOIN worker_cache_job_acks a
        ON a.job_id = j.id AND a.worker_id = ${workerId}
      WHERE j.locale IN (${locales})
        AND a.job_id IS NULL
      ORDER BY j.requested_at ASC
      LIMIT ${limit}`;
    const [rows] = (await this.deps.query(query)) ?? [[]];
    return (rows as JobRow[]).map((row) => ({
      id: row.id,
      guild_id: String(row.guild_id),
      locale: row.locale,
      scope: row.scope,
      types: parseTypes(row.types),
      requested_at: row.requested_at,
    }));
  }

  async ackJob(jobId: number, workerId: string) {
    return this.deps.query(SQL`
      INSERT IGNORE INTO worker_cache_job_acks (job_id, worker_id)
      VALUES (${jobId}, ${workerId})`);
  }

  async countAcks(jobId: number): Promise<number> {
    const query = SQL`SELECT COUNT(*) AS count FROM worker_cache_job_acks WHERE job_id = ${jobId}`;
    const [rows] = (await this.deps.query(query)) ?? [[]];
    return Number((rows as Array<{ count: number }>)?.[0]?.count ?? 0);
  }

  async deleteJob(id: number) {
    return this.deps.query(SQL`DELETE FROM worker_cache_jobs WHERE id = ${id}`);
  }

  async getGuildChannelIds(guildId: string): Promise<string[]> {
    const query = SQL`SELECT id FROM channels WHERE guild_id = ${guildId}`;
    const [rows] = (await this.deps.query(query)) ?? [[]];
    return (rows as Array<{ id: string }>).map((row) => String(row.id));
  }

  async getGuildLocales(guildId: string): Promise<string[]> {
    const query = SQL`
      SELECT DISTINCT SUBSTRING(
        COALESCE(
          (SELECT s.val FROM settings s
            WHERE s.channel_id = channels.id AND s.setting = 'language'
            LIMIT 1),
          channels.language
        ),
        1,
        2
      ) AS locale
      FROM channels
      WHERE guild_id = ${guildId}`;
    const [rows] = (await this.deps.query(query)) ?? [[]];
    return [...new Set((rows as Array<{ locale: string }>).map((row) => String(row.locale).substring(0, 2)))].filter(
      Boolean
    );
  }

  /** Test helper — wipe queue between integration specs. */
  async clearAllJobs() {
    await this.deps.query(SQL`DELETE FROM worker_cache_job_acks`);
    await this.deps.query(SQL`DELETE FROM worker_cache_jobs`);
  }

  async enqueueGuildRefresh(guildId: string, scope: WorkerCacheRefreshStamp | 'all') {
    const scopes = scope === 'all' ? REFRESH_SCOPES : [scope];
    await Promise.all(
      scopes.map(async (entry) => {
        if (entry === 'pings') {
          await this.enqueuePings(guildId);
          return;
        }
        if (entry === 'guild') {
          await this.enqueueGuild(guildId);
          return;
        }
        const locales = await this.getGuildLocales(guildId);
        await Promise.all(locales.map((locale) => this.enqueueTrackables(guildId, locale, null)));
      })
    );
  }

  async bumpRefreshStamp(scope: WorkerCacheRefreshStamp | 'all') {
    const scopes = scope === 'all' ? REFRESH_SCOPES : [scope];
    await Promise.all(
      scopes.map((entry) =>
        this.deps.query(SQL`
          INSERT INTO worker_cache_refresh_stamps (scope, requested_at)
          VALUES (${entry}, CURRENT_TIMESTAMP)
          ON DUPLICATE KEY UPDATE requested_at = CURRENT_TIMESTAMP`)
      )
    );
  }

  async getRefreshStamps(): Promise<Record<WorkerCacheRefreshStamp, number>> {
    const query = SQL`SELECT scope, requested_at FROM worker_cache_refresh_stamps`;
    const [rows] = (await this.deps.query(query)) ?? [[]];
    const stamps = Object.fromEntries(REFRESH_SCOPES.map((scope) => [scope, 0])) as Record<
      WorkerCacheRefreshStamp,
      number
    >;
    (rows as Array<{ scope: WorkerCacheRefreshStamp; requested_at: Date }>).forEach((row) => {
      stamps[row.scope] = new Date(row.requested_at).getTime();
    });
    return stamps;
  }
}

export { isSharedScope };
