import Discord from 'discord.js';
import logger from './Logger.js';

const { WebhookClient } = Discord;
const lookupWebhooks = process.env.LOOKUP_WEBHOOKS === 'true';

/**
 * Send a webhook based on context
 * @param {CommandContext} ctx context object for sending data
 * @param {string} content content to send for webhook message
 * @param {Array<Discord.MessageEmbed>} embeds message embeds to send on webhook
 * @returns {Promise<Discord.APIMessage|boolean|*>}
 */
const webhook = async (ctx, { content, embeds = undefined }) => {
  // eslint-disable-next-line no-param-reassign
  embeds = Array.isArray(embeds) ? embeds : [embeds];
  if (ctx.webhook && ctx.webhook.id && ctx.webhook.token) {
    const client = new WebhookClient({ id: ctx.webhook.id, token: ctx.webhook.token });
    const opts = {
      avatarURL: ctx?.webhook?.avatar,
      username: ctx?.webhook?.name,
      embeds,
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
      await this.settings.deleteWebhooksForChannel(ctx.channel.id);
      logger.error(`Could not send webhook for ${ctx.channel.id} attempting after wiping context.`);
      return false;
    }
  }
  const channelWebhook = await this.settings.getChannelWebhook(ctx.channel);
  if (channelWebhook && channelWebhook.token && channelWebhook.id) {
    // eslint-disable-next-line no-param-reassign
    ctx.webhook = channelWebhook;
    return webhook(ctx, { content, embeds });
  }

  const useBotLogic = this.scope === 'bot' && ctx.channel.permissionsFor(this.client.user.id).has('MANAGE_WEBHOOKS');

  // find how to do this with rest instead of a discord client
  if (ctx.channel) {
    if (useBotLogic) {
      const webhooks = await ctx.channel.fetchWebhooks();
      let target;
      if (webhooks.array().length > 0) {
        [target] = webhooks.array();
      } else {
        target = await ctx.channel.createWebhook(this.client.user.username);
      }
      logger.debug(`Created and adding ${JSON.stringify(target)} to ${ctx.channel}`);
      target.name = this.client.user.username;
      target.avatar = this.client.user.displayAvatarURL()
        .replace('.webp', '.png')
        .replace('.webm', '.gif')
        .replace('?size=2048', '');

      // Make this one query
      const success = await this.settings.setChannelWebhook(ctx.channel, target);
      if (!success) {
        logger.error(`Could not finish adding webhook for ${ctx.channel}`);
        return false;
      }
      ctx.webhook = target;
      return webhook(ctx, { content, embeds });
    }
    if (!lookupWebhooks) {
      logger.silly(`Could not obtain webhook for ${ctx.channel.id}`);
      return false;
    }
    logger.debug(`Leveraging worker route for obtaining webhook... ${ctx.channel.id}`);
    let target = await this.client.getWebhook(ctx.channel);
    if (target && target.id && target.token) {
      logger.debug(`Got webhook back for ${ctx.channel.id}!`);

      target = {
        id: target.id,
        token: target.token,
        name: target.user.username,
        avatar: this.settings.defaults.avatar,
      };

      const success = await this.settings.setChannelWebhook(ctx.channel, target);
      if (!success) {
        logger.debug(`Failed to save webhook for ${ctx.channel.id}!`);
      }

      ctx.webhook = target;
      return webhook(ctx, { content, embeds });
    }
    logger.debug(`Could not create webhook for ${ctx.channel.id}`);
  }
  // Don't have a fallback to embeds
  return false;
};

export default webhook;
