'use strict';

const { WebhookClient, User } = require('discord.js');

const logger = require('../Logger');

const defMsgOpts = {
  msgOpts: undefined,
  deleteOriginal: true,
  deleteResponse: true,
  deleteAfter: false,
  message: undefined,
};

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

    const perms = ['VIEW_CHANNEL', 'SEND_MESSAGES', msgOpts && msgOpts.embed ? 'EMBED_LINKS' : undefined].map(perm => perm);

    const canSend = isDM || (target.type === 'text' && target.permissionsFor(this.client.user.id).has(perms));

    if (canSend) {
      try {
        if (!target.client) {
          logger.error('Target is not TextBasedChannel');
        }
        const msg = await target.send(content, msgOpts);
        await this.deleteCallAndResponse(message, msg, delCall, delRes);
        if (deleteAfter) {
          msg.delete({ timeout: deleteAfter });
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
   * Send a message, with options to delete messages after calling
   * @param {Message} message original message being responded to
   * @param {string} content String to send to a channel
   * @param {boolean} delCall True to delete the original message
   * @param {boolean} delRes True to delete the sent message after time
   * @returns {Message} sent message
   */
  async sendMessage(message, content, delCall, delRes) {
    return this.send(message.channel, content, { delCall, delRes, message });
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

    const perms = ['VIEW_CHANNEL', 'SEND_MESSAGES', msgOpts && msgOpts.embed ? 'EMBED_LINKS' : undefined].map(perm => perm);

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

  /**
   * Send an embed, with options to delete messages after calling
   * @param {Message} message original message being responded to
   * @param {Object} embed Embed object to send
   * @param {boolean} delCall True to delete the original message
   * @param {boolean} delRes True to delete the sent message after time
   * @param {content} content Content of the embed, prepended to the embed.
   * @returns {null|Promise<Message>}
   */
  async embed(message, embed, delCall, delRes, content) {
    return this.send(message.channel, content, {
      msgOpts: { embed }, delCall, delRes, message,
    });
  }

  /**
   * Send an embed
   * @param {Channel} channel channel to send message to
   * @param {Object} embed Embed object to send
   * @param {string} prepend String to prepend to the embed
   * @param {nunber} delRes delete after a specified time
   *
   * @returns {Promise<Discord.Message>}
   */
  async embedToChannel(channel, embed, prepend, delRes) {
    return this.send(channel, prepend, {
      msgOpts: { embed }, delRes,
    });
  }

  /**
   * Send a message, with options to delete messages after calling
   * @param {Message} message original message being responded to
   * @param {string} content String to send to a channel
   * @param {boolean} delRes True to delete the sent message after time
   * @returns {Promise<Message>}
   * @deprecated
   */
  async sendDirectMessageToAuthor(message, content, delRes) {
    return this.send(message.author, content, { delRes, message });
  }

  /**
   * Send a message, with options to delete messages after calling
   * @param {TextChannel} user user being sent a message
   * @param {string} content String to send to a channel
   * @returns {Promise<Message>}
   * @deprecated use `#send`
   */
  async sendDirectMessageToUser(user, content) {
    return this.send(user, content);
  }

  /**
   * Send a message, with options to delete messages after calling
   * @param {Message} message original message being responded to
   * @param {Object} embed Embed object to send
   * @param {boolean} delRes True to delete the sent message after time
   * @returns {Promise<Message>}
   * @deprecated use `#send`
   */
  async sendDirectEmbedToAuthor(message, embed, delRes) {
    return this.send(message.author, undefined, { msgOpts: { embed }, delRes, message });
  }

  async sendDirectEmbedToOwner(embed) {
    return this.send(await this.client.users.cache
      .get(this.owner), undefined, { msgOpts: { embed } });
  }

  /**
   * Alias for #send with specific information, to the original messages author
   * @param  {Discord.Message}  message  message to reply/send to author
   * @param  {Object}  file     file to send
   * @param  {string}  fileName name of file, with extension
   * @param  {boolean}  delCall  whether or not to delete the call
   * @returns {Promise<Discord.Message>}
   */
  async sendFileToAuthor(message, file, fileName, delCall) {
    return this.send(message.author, undefined, {
      msgOpts: {
        files: [{ attachment: file, name: fileName }],
      },
      delCall,
      message,
    });
  }

  async sendFile(message, prepend, file, fileName, delCall) {
    return this.send(message.channel, prepend, {
      msgOpts: {
        files: [{ attachment: file, name: fileName }],
      },
      delCall,
      message,
    });
  }

  /**
   * Notify channel of settings change if enabled
   * @param {Message} message Message to reply to and fetch channel settings from
   * @param {boolean} delCall whether or not to delete the original message
   * @param {boolean} delRes whether or not to delete the response message
   * @returns {null|Promise<Message>}
   */
  async notifySettingsChange(message, delCall, delRes) {
    await message.react('\u2705');
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

  async webhook(ctx, { text, embed = undefined }) {
    if (ctx.webhook && ctx.webhook.id && ctx.webhook.token) {
      const client = new WebhookClient(ctx.webhook.id, ctx.webhook.token);
      try {
        const embedCopy = { ...embed };
        if (ctx.webhook.avatar) {
          embedCopy.avatarURL = ctx.webhook.avatar;
        }
        if (ctx.webhook.name) {
          embedCopy.username = ctx.webhook.name;
        }
        return client.send(text, embedCopy);
      } catch (e) {
        logger.error(e);
        await this.settings.deleteWebhooksForChannel(ctx.channel.id);
        logger.error(`Could not send webhook for ${ctx.channel.id} attempting after wiping context.`);
        return false;
      }
    }
    const channelWebhook = await this.settings.getChannelWebhook(ctx.channel);
    if (!embed.embeds) {
      // eslint-disable-next-line no-param-reassign
      embed = this.webhookWrapEmbed(embed, ctx);
    }
    if (channelWebhook && channelWebhook.token && channelWebhook.id) {
      // eslint-disable-next-line no-param-reassign
      ctx.webhook = channelWebhook;
      return this.webhook(ctx, { text, embed });
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
        // eslint-disable-next-line no-param-reassign
        ctx.webhook = webhook;
        return this.webhook(ctx, { text, embed });
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
        return this.webhook(ctx, { text, embed });
      }
      logger.error(`Could not create webhook for ${ctx.channel.id}`);
    }
    // Don't have a fallback to embeds
    return false;
  }

  webhookWrapEmbed(embed, ctx) {
    return ctx.webhook && ctx.webhook.avatar
      ? {
        username: ctx.webhook.name,
        avatarURL: ctx.webhook.avatar,
        embeds: [embed],
      }
      : {
        username: this.settings.defaults.username,
        avatarURL: this.settings.defaults.avatar,
        embeds: [embed],
      };
  }

  webhookWrapEmbeds(embeds, ctx) {
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
}

module.exports = MessageManager;
