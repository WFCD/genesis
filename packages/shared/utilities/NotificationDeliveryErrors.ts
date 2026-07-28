import { DiscordAPIError } from 'discord.js';

export const ISSUE_CODE = {
  unknownGuild: 'unknown_guild',
  threadLocked: 'thread_locked',
  unknownWebhook: 'unknown_webhook',
} as const;

export type DeliveryErrorKind = 'unknown_guild' | 'thread_locked' | 'unknown_webhook' | 'other';

export const classifyDeliveryError = (error: unknown): DeliveryErrorKind => {
  if (error instanceof DiscordAPIError) {
    if (error.code === 10004) return 'unknown_guild';
    if (error.code === 50083) return 'thread_locked';
    if (error.code === 10015 || error.code === 50027) return 'unknown_webhook';
  }
  const message = error instanceof Error ? error.message : String(error ?? '');
  if (/unknown guild/i.test(message) || /couldn't find guild/i.test(message)) return 'unknown_guild';
  if (/thread is locked/i.test(message)) return 'thread_locked';
  if (/unknown webhook/i.test(message)) return 'unknown_webhook';
  return 'other';
};
