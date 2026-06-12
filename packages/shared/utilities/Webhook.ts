import { PermissionFlagsBits, WebhookClient, type TextChannel } from 'discord.js';

import type { CommandContext } from '#shared/types/context';

import logger from './Logger';

export type SentWebhookMessage = { id: string };

const lookupWebhooks = process.env.LOOKUP_WEBHOOKS === 'true';

type WebhookPayload = {
  content?: string;
  text?: string;
  embeds?: unknown;
};

type StoredWebhook = NonNullable<CommandContext['webhook']>;

export type WebhookHost = {
  settings: {
    channels: {
      deleteWebhooksForChannel(channelId: string): Promise<unknown>;
      getWebhook(channel: unknown): Promise<StoredWebhook | undefined>;
      setWebhook(channel: unknown, target: unknown): Promise<boolean>;
    };
    defaults: { avatar?: string };
  };
  scope?: string;
  client?: {
    user: { id: string; username: string; displayAvatarURL(): string };
    getWebhook?(channel: unknown): Promise<{ id: string; token: string; user: { username: string } } | undefined>;
  };
};

type WebhookContext = CommandContext & {
  channel?: TextChannel | { id?: string; permissionsFor?(id: string): { has(perm: bigint): boolean } | null };
  threadId?: string;
};

async function sendWebhook(
  host: WebhookHost | undefined,
  ctx: WebhookContext,
  { content, embeds = undefined }: WebhookPayload
): Promise<SentWebhookMessage | false> {
  const embedList = Array.isArray(embeds) ? embeds : embeds ? [embeds] : undefined;
  if (ctx.webhook?.id && ctx.webhook.token) {
    const client = new WebhookClient({ id: ctx.webhook.id, token: ctx.webhook.token });
    const opts = {
      avatarURL: ctx.webhook.avatar,
      username: ctx.webhook.name,
      embeds: embedList,
      threadId: ctx.threadId,
    };
    try {
      return content?.length
        ? client.send({
            ...opts,
            content,
          })
        : client.send(opts);
    } catch (e) {
      logger.error(e);
      if (ctx.channel?.id && host?.settings) {
        await host.settings.channels.deleteWebhooksForChannel(ctx.channel.id);
        logger.error(`Could not send webhook for ${ctx.channel.id} attempting after wiping context.`);
      }
      return false;
    }
  }
  if (!host?.settings) {
    return false;
  }
  const channelWebhook = await host.settings.channels.getWebhook(ctx.channel);
  if (channelWebhook?.token && channelWebhook.id) {
    ctx.webhook = channelWebhook;
    return sendWebhook(host, ctx, { content, embeds });
  }

  const useBotLogic =
    host.scope === 'bot' &&
    ctx.channel?.permissionsFor?.(host.client!.user.id)?.has(PermissionFlagsBits.ManageWebhooks);

  if (ctx.channel) {
    if (useBotLogic && host.client) {
      const channel = ctx.channel as TextChannel;
      const webhooks = await channel.fetchWebhooks();
      let target = webhooks.first() ?? undefined;
      if (!target) {
        target = await channel.createWebhook({ name: host.client.user.username });
      }
      logger.debug(`Created and adding ${JSON.stringify(target)} to ${ctx.channel}`);

      const stored: StoredWebhook = {
        id: target.id,
        token: target.token ?? undefined,
        name: host.client.user.username,
        avatar: host.client.user
          .displayAvatarURL()
          .replace('.webp', '.png')
          .replace('.webm', '.gif')
          .replace('?size=2048', ''),
      };

      const success = await host.settings.channels.setWebhook(ctx.channel, stored);
      if (!success) {
        logger.error(`Could not finish adding webhook for ${ctx.channel}`);
        return false;
      }
      ctx.webhook = stored;
      return sendWebhook(host, ctx, { content, embeds });
    }
    if (!lookupWebhooks) {
      logger.silly(`Could not obtain webhook for ${ctx.channel.id}`);
      return false;
    }
    logger.debug(`Leveraging worker route for obtaining webhook... ${ctx.channel.id}`);
    const target = await host.client?.getWebhook?.(ctx.channel);
    if (target?.id && target.token) {
      logger.debug(`Got webhook back for ${ctx.channel.id}!`);

      const stored: StoredWebhook = {
        id: target.id,
        token: target.token,
        name: target.user.username,
        avatar: host.settings.defaults.avatar,
      };

      const success = await host.settings.channels.setWebhook(ctx.channel, stored);
      if (!success) {
        logger.debug(`Failed to save webhook for ${ctx.channel.id}!`);
      }

      ctx.webhook = stored;
      return sendWebhook(host, ctx, { content, embeds });
    }
    logger.debug(`Could not create webhook for ${ctx.channel.id}`);
  }
  return false;
}

/** Send a webhook based on context. Use `.call(host, ctx, payload)` when host settings are required. */
const webhook = Object.assign((ctx: WebhookContext, payload: WebhookPayload) => sendWebhook(undefined, ctx, payload), {
  call(host: WebhookHost, ctx: WebhookContext, payload: WebhookPayload) {
    return sendWebhook(host, ctx, payload);
  },
});

export default webhook;
