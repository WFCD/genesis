'use strict';

const { WebhookClient, User, Permissions } = require('discord.js');

const logger = require('../Logger');

const defMsgOpts = {
  msgOpts: undefined,
  deleteOriginal: true,
  deleteResponse: true,
  deleteAfter: false,
  message: undefined,
};

const lookupWebhooks = process.env.LOOKUP_WEBHOOKS === 'true';

const minPerms = [ Permissions.FLAGS.VIEW_CHANNEL, Permissions.FLAGS.SEND_MESSAGES ];

/**
 * MessageManager for.... sending messages and deleting them and stuff
 */
class MessageManager {
  /**
   * Construct a message manager for sending and managing messages
   * @param {Genesis} bot bot containing necessary settings
   */
  constructor(bot) {
    this.client = bot.client;
    this.settings = bot.settings;
    this.owner = bot.owner;

    this.scope = process.env.SCOPE || 'worker';

    this.statuses = {
      SUCCESS: 'SUCCESS',
      FAILURE: 'FAILURE',
      NO_ACCESS: 'NO ACCESS',
    };
  }

  /**
   * Simplified sending wrapper for existing send operations
   * @param  {Discord.TextChannel}    target          Text channel implementation to send to
   * @param  {string}                 content         String content to send with message
   * @param  {Discord.MessageOptions} msgOpts         Discord message options to send, such as
   *  embeds, attachments, files, etc.
   * @param  {boolean}                delCall         delete the original after sending
   * @param  {boolean}                delRes          delete the response after sending
   * @returns {Promise.<Discord.Message>}              Message Promise
   */
  async send(target, content = '', {
    msgOpts, delCall, delRes, deleteAfter, message,
  } = defMsgOpts) {
    if (!target) {
      logger.error('Cannot call #send without a target.');
      return undefined;
    }

    const isDM = target instanceof User || target.type === 'dm';
    let perms = [...minPerms];
    if (msgOpts && msgOpts.embed) {
      perms = [Permissions.FLAGS.EMBED_LINKS, ...minPerms];
    }
    const canSend = isDM || (target.type === 'text' && target.permissionsFor(this.client.user.id).has(perms));

    if (canSend) {
      try {
        if (!target.client) {
          logger.error('Target is not TextBasedChannel');
        }
        const msg = await target.send(content, msgOpts);
        await this.deleteCallAndResponse(message, msg, delCall, delRes);
        if (deleteAfter) {
          this.client.setTimeout(msg.delete, deleteAfter);
        }
        return msg;
      } catch (e) {
        logger.error(`${e.message} occured while sending.`);
      }
    } else {
      logger.debug(`Cannot send in ${target.id}`);
    }
    return undefined;
  }

  /**
   * Simplified reply wrapper for existing send operations
   * @param  {Discord.Message}        message         Message
   * @param  {string}                 content         String content to send with message
   * @param  {Discord.MessageOptions} msgOpts         Discrd message options to send, such as
   *                                                    embeds, attachments, files, etc.
   * @param  {boolean}                delCall         delete the original after sending
   * @param  {boolean}                delRes          delete the response after sending
   * @param  {boolean}                deleteAfter     amount of time, if at all, to delete
   *                                                     a messsage after
   * @returns {Promise.<Discord.Message>}              Message Promise
   */
  async reply(message, content = '', {
    msgOpts, delCall = false, delRes = false, deleteAfter,
  } = defMsgOpts) {
    if (!message.channel) {
      logger.error('Cannot call #send without a target.');
      return undefined;
    }

    const isDM = message.channel instanceof User || message.channel.type === 'dm';
    let perms = [...minPerms];
    if (msgOpts && msgOpts.embed) {
      perms = [Permissions.FLAGS.EMBED_LINKS, ...minPerms];
    }
    const canSend = isDM || (message.channel.type === 'text' && message.channel.permissionsFor(this.client.user.id).has(perms));

    if (canSend) {
      try {
        if (!message.channel.client) {
          logger.error('Target is not TextBasedChannel');
        }
        const msg = await message.reply(content, msgOpts);
        await this.deleteCallAndResponse(message, msg, delCall, delRes);
        if (deleteAfter) {
          msg.delete({ timeout: deleteAfter, reason: 'Automated cleanup' });
        }
        return msg;
      } catch (e) {
        logger.error(`${e.message} occured while sending.`);
      }
    } else {
      logger.debug(`Cannot send in ${message.channel.id}`);
    }
    return undefined;
  }

  wrap(embed, ctx) {
    return this.wraps([embed], ctx);
  }

  wraps(embeds, ctx) {
    return ctx.webhook && ctx.webhook.avatar
      ? {
        username: ctx.webhook.name,
        avatarURL: ctx.webhook.avatar,
        embeds,
      }
      : {
        username: this.settings.defaults.username,
        avatarURL: this.settings.defaults.avatar,
        embeds,
      };
  }

  /**
   * Notify channel of settings change if enabled
   * @param {Message} message Message to reply to and fetch channel settings from
   * @param {boolean} delCall whether or not to delete the original message
   * @param {boolean} delRes whether or not to delete the response message
   * @returns {null|Promise<Message>}
   */
  async notifySettingsChange(message, delCall, delRes) {
    const respondToSettings = await this.settings.getChannelSetting(message.channel, 'respond_to_settings') === '1';

    if (respondToSettings) {
      return this.send(message.channel, 'Settings updated', { delCall, delRes });
    }
    return null;
  }

  /**
   * Delete call and response for a command, depending on settings
   * @param  {Message} call           calling command
   * @param  {Message} response       response message
   * @param  {boolean} delCall        whether or not to delete the calling message
   * @param  {boolean} delRes         whether or not to delete the message response
   * @returns {Discord.Message}       the response
   */
  async deleteCallAndResponse(call, response, delCall, delRes) {
    if (call && call.channel) {
      const deleteCallSetting = await this.settings.getChannelSetting(call.channel, 'delete_after_respond') === '1';
      if (deleteCallSetting && delCall && call.deletable) {
        call.delete({ timeout: 10000, reason: 'Automated cleanup' });
      }
    }
    const deleteResponseSetting = await this.settings.getChannelSetting(response.channel, 'delete_response') === '1';
    if (deleteResponseSetting && delRes && response.deletable) {
      response.delete({ timeout: 30000, reason: 'Automated cleanup' });
    }

    return response;
  }

  async webhook(ctx, { content, embeds = undefined }) {
    // eslint-disable-next-line no-param-resassign
    embeds = Array.isArray(embeds) ? embeds : [embeds];
    if (ctx.webhook && ctx.webhook.id && ctx.webhook.token) {

      const client = new WebhookClient(ctx.webhook.id, ctx.webhook.token);
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
      return this.webhook(ctx, { content, embeds });
    }

    const useBotLogic = this.scope === 'bot' && ctx.channel.permissionsFor(this.client.user.id).has('MANAGE_WEBHOOKS');

    // find how to do this with rest instead of a discord client
    if (ctx.channel) {
      if (useBotLogic) {
        const webhooks = await ctx.channel.fetchWebhooks();
        let webhook;
        if (webhooks.array().length > 0) {
          [webhook] = webhooks.array();
        } else {
          webhook = await ctx.channel.createWebhook(this.client.user.username);
        }
        logger.debug(`Created and adding ${JSON.stringify(webhook)} to ${ctx.channel}`);
        webhook.name = this.client.user.username;
        webhook.avatar = this.client.user.displayAvatarURL()
          .replace('.webp', '.png')
          .replace('.webm', '.gif')
          .replace('?size=2048', '');

        // Make this one query
        const success = await this.settings.setChannelWebhook(ctx.channel, webhook);
        if (!success) {
          logger.error(`Could not finish adding webhook for ${ctx.channel}`);
          return false;
        }
        ctx.webhook = webhook;
        return this.webhook(ctx, { content, embeds });
      }
      if (!lookupWebhooks) {
        logger.silly(`Could not obtain webhook for ${ctx.channel.id}`);
        return false;
      }
      logger.debug(`Leveraging worker route for obtaining webhook... ${ctx.channel.id}`);
      let webhook = await this.client.getWebhook(ctx.channel);
      if (webhook && webhook.id && webhook.token) {
        logger.debug(`Got webhook back for ${ctx.channel.id}!`);

        webhook = {
          id: webhook.id,
          token: webhook.token,
          name: webhook.user.username,
          avatar: this.settings.defaults.avatar,
        };

        const success = await this.settings.setChannelWebhook(ctx.channel, webhook);
        if (!success) {
          logger.debug(`Failed to save webhook for ${ctx.channel.id}!`);
        }

        ctx.webhook = webhook;
        return this.webhook(ctx, { content, embeds });
      }
      logger.debug(`Could not create webhook for ${ctx.channel.id}`);
    }
    // Don't have a fallback to embeds
    return false;
  }
}

module.exports = MessageManager;
