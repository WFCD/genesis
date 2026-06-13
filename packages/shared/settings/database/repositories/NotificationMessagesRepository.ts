import SQL from 'sql-template-strings';

import type { DatabaseDeps } from '#shared/settings/database/DatabaseDeps';

export type NotificationMessageRow = {
  id: number;
  channel_id: string;
  thread_id: string;
  message_id: string;
  webhook_id: string;
  webhook_token: string;
  trackable_type: string;
  event_id: string | null;
  expires_at: Date;
  status: 'pending' | 'failed';
  attempts: number;
  last_error: string | null;
  sent_at: Date;
};

export type EnqueueNotificationMessage = {
  channelId: string;
  threadId?: string | number;
  messageId: string;
  webhookId: string;
  webhookToken: string;
  trackableType: string;
  eventId?: string | null;
  expiresAt: Date;
};

type Row = {
  id: number;
  channel_id: string;
  thread_id: string;
  message_id: string;
  webhook_id: string;
  webhook_token: string;
  trackable_type: string;
  event_id: string | null;
  expires_at: Date;
  status: 'pending' | 'failed';
  attempts: number;
  last_error: string | null;
  sent_at: Date;
};

const mapRow = (row: Row): NotificationMessageRow => ({
  id: row.id,
  channel_id: String(row.channel_id),
  thread_id: String(row.thread_id),
  message_id: String(row.message_id),
  webhook_id: String(row.webhook_id),
  webhook_token: row.webhook_token,
  trackable_type: row.trackable_type,
  event_id: row.event_id,
  expires_at: row.expires_at,
  status: row.status,
  attempts: Number(row.attempts),
  last_error: row.last_error,
  sent_at: row.sent_at,
});

export default class NotificationMessagesRepository {
  constructor(private readonly deps: DatabaseDeps) {}

  async enqueue(entry: EnqueueNotificationMessage) {
    const threadId = entry.threadId ?? 0;
    const query = SQL`
      INSERT INTO notification_messages (
        channel_id, thread_id, message_id, webhook_id, webhook_token,
        trackable_type, event_id, expires_at
      ) VALUES (
        ${entry.channelId},
        ${threadId},
        ${entry.messageId},
        ${entry.webhookId},
        ${entry.webhookToken},
        ${entry.trackableType},
        ${entry.eventId ?? null},
        ${entry.expiresAt}
      )`;
    return this.deps.query(query);
  }

  async fetchDue(limit = 500): Promise<NotificationMessageRow[]> {
    const query = SQL`
      SELECT id, channel_id, thread_id, message_id, webhook_id, webhook_token,
        trackable_type, event_id, expires_at, status, attempts, last_error, sent_at
      FROM notification_messages
      WHERE status = 'pending' AND expires_at <= CURRENT_TIMESTAMP
      ORDER BY expires_at ASC
      LIMIT ${limit}`;
    const [rows] = (await this.deps.query(query)) ?? [[]];
    return (rows as Row[]).map(mapRow);
  }

  async deleteByIds(ids: number[]) {
    if (!ids.length) return;
    return this.deps.query(SQL`DELETE FROM notification_messages WHERE id IN (${ids})`);
  }

  async markFailed(id: number, error: string) {
    return this.deps.query(SQL`
      UPDATE notification_messages
      SET status = 'failed', attempts = attempts + 1, last_error = ${error.substring(0, 255)}
      WHERE id = ${id}`);
  }

  async purgeFailed(maxAttempts = 3) {
    return this.deps.query(SQL`
      DELETE FROM notification_messages
      WHERE status = 'failed' AND attempts >= ${maxAttempts}`);
  }

  /** Test helper — wipe queue between integration specs. */
  async clearAll() {
    return this.deps.query(SQL`DELETE FROM notification_messages`);
  }
}
