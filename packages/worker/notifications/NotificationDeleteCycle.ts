// @ts-nocheck -- incremental TS migration; worker notification runtime
import { DiscordAPIError, WebhookClient } from 'discord.js';

import logger from '#shared/utilities/Logger';

const BATCH_SIZE = Number(process.env.DELETE_BATCH_SIZE || 500);
const BACKOFF_TICKS = Number(process.env.DELETE_BACKOFF_TICKS || 2);
const MAX_ATTEMPTS = Number(process.env.DELETE_MAX_ATTEMPTS || 3);

let deleteCycleActive = false;
let backoffTicksRemaining = 0;

const isUnknownMessage = (error: unknown) =>
  error instanceof DiscordAPIError && (error.code === 10008 || error.message?.includes('Unknown Message'));

const isRateLimit = (error: unknown) =>
  error instanceof DiscordAPIError && (error.code === 429 || error.status === 429);

const isInvalidWebhook = (error: unknown) =>
  error instanceof DiscordAPIError &&
  (error.code === 10015 || error.code === 50027 || error.message?.includes('Unknown Webhook'));

/**
 * Delete expired webhook notification messages in bounded batches.
 * @param {import('#shared/settings/Database').default} settings
 */
export async function runNotificationDeleteCycle(settings) {
  if (deleteCycleActive) {
    logger.debug('Skipping notification delete cycle... already running');
    return;
  }
  if (backoffTicksRemaining > 0) {
    backoffTicksRemaining -= 1;
    logger.debug(`Notification delete cycle backoff (${backoffTicksRemaining} ticks remaining)`);
    return;
  }

  deleteCycleActive = true;
  try {
    const rows = await settings.notificationMessages.fetchDue(BATCH_SIZE);
    if (!rows.length) return;

    const groups = new Map();
    rows.forEach((row) => {
      const key = `${row.webhook_id}:${row.webhook_token}`;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(row);
    });

    for (const groupRows of groups.values()) {
      const { webhook_id: webhookId, webhook_token: webhookToken } = groupRows[0];
      const client = new WebhookClient({ id: webhookId, token: webhookToken });
      const succeeded = [];

      for (const row of groupRows) {
        try {
          const threadId = row.thread_id && row.thread_id !== '0' ? row.thread_id : undefined;
          await client.deleteMessage(row.message_id, threadId);
          succeeded.push(row.id);
        } catch (error) {
          if (isUnknownMessage(error)) {
            succeeded.push(row.id);
            continue;
          }
          if (isRateLimit(error)) {
            backoffTicksRemaining = BACKOFF_TICKS;
            logger.warn('Notification delete cycle hit rate limit; backing off');
            break;
          }

          const message = error instanceof Error ? error.message : String(error);
          await settings.notificationMessages.markFailed(row.id, message);
          if (isInvalidWebhook(error)) {
            await settings.channels.deleteWebhooksForChannel(row.channel_id);
          }
        }
      }

      if (succeeded.length) {
        await settings.notificationMessages.deleteByIds(succeeded);
      }

      if (backoffTicksRemaining > 0) break;
    }

    await settings.notificationMessages.purgeFailed(MAX_ATTEMPTS);
  } catch (error) {
    logger.error(error, 'NotificationDeleteCycle');
  } finally {
    deleteCycleActive = false;
  }
}

export default runNotificationDeleteCycle;
