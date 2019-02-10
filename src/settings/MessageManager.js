'use strict';

/**
 * MessageManager for.... sending messages and deleting them and stuff
 */
class MessaageManager {
  /**
   * Construct a message manager for sending and managing messages
   * @param {Genesis} bot bot containing necessary settings
   */
  constructor(bot) {
    this.client = bot.client;
    this.logger = bot.logger;
    this.settings = bot.settings;
    this.owner = bot.owner;
    this.discord = bot.discord;

    /**
     * Zero space whitespace character to prepend to any messages sent
     * to prevent a command from inadvertantly being triggered.
     * @type {string}
     */
    this.zSWC = '\u200B';

    this.statuses = {
      SUCCESS: 'SUCCESS',
      FAILURE: 'FAILURE',
      NO_ACCESS: 'NO ACCESS',
    };
  }

  /**
   * Send a message, with options to delete messages after calling
   * @param {Message} message original message being responded to
   * @param {string} content String to send to a channel
   * @param {boolean} deleteOriginal True to delete the original message
   * @param {boolean} deleteResponse True to delete the sent message after time
   * @returns {Message} sent message
   */
  async sendMessage(message, content, deleteOriginal, deleteResponse) {
    if (message.channel && ((message.channel.type === 'text'
        && message.channel.permissionsFor(this.client.user.id).has('SEND_MESSAGES'))
        || message.channel.type === 'dm')) {
      const msg = await message.channel.send(`${this.zSWC}${content}`);
      await this.deleteCallAndResponse(message, msg, deleteOriginal, deleteResponse);
      return msg;
    }
    return undefined;
  }

  /**
   * Send a message, with options to delete messages after calling
   * @param {Message} message original message being responded to
   * @param {string} content String to send to a channel
   * @param {boolean} deleteOriginal True to delete the original message
   * @param {boolean} deleteResponse True to delete the sent message after time
   * @returns {null|Promise<Message>}
   */
  async replyMessageRetPromise(message, content, deleteOriginal, deleteResponse) {
    if ((message.channel.type === 'text'
        && message.channel.permissionsFor(this.client.user.id).has('SEND_MESSAGES'))
        || message.channel.type === 'dm') {
      const msg = await message.channel.send(`${this.zSWC}${content}`);
      return this.deleteCallAndResponse(message, msg, deleteOriginal, deleteResponse);
    }
    return null;
  }

  /**
   * Send a message, with options to delete messages after calling
   * @param {Message} message original message being responded to
   * @param {string} content String to send to a channel
   * @param {boolean} deleteOriginal True to delete the original message
   * @param {boolean} deleteResponse True to delete the sent message after time
   * @returns {null|Promise<Message>}
   */
  async reply(message, content, deleteOriginal, deleteResponse) {
    if ((message.channel && message.channel.type === 'text'
        && message.channel.permissionsFor(this.client.user.id).has('SEND_MESSAGES'))
        || message.channel.type === 'dm') {
      const msg = await message.reply(`${this.zSWC}${content}`);
      return this.deleteCallAndResponse(message, msg, deleteOriginal, deleteResponse);
    }
    return null;
  }

  /**
   * Send an embed, with options to delete messages after calling
   * @param {Message} message original message being responded to
   * @param {Object} embed Embed object to send
   * @param {boolean} deleteOriginal True to delete the original message
   * @param {boolean} deleteResponse True to delete the sent message after time
   * @param {content} content Content of the embed, prepended to the embed.
   * @returns {null|Promise<Message>}
   */
  async embed(message, embed, deleteOriginal, deleteResponse, content) {
    if ((message.channel.type === 'text'
      && message.channel.permissionsFor(this.client.user.id)
        .has(['SEND_MESSAGES', 'EMBED_LINKS']))
      || message.channel.type === 'dm') {
      let msg;
      if (content) {
        msg = await message.channel.send(content, { embed });
      } else {
        msg = await message.channel.send({ embed });
      }

      this.deleteCallAndResponse(message, msg, deleteOriginal, deleteResponse);
      return msg;
    }
    return null;
  }

  /**
   * Send an embed
   * @param {Channel} channel channel to send message to
   * @param {Object} embed Embed object to send
   * @param {string} prepend String to prepend to the embed
   * @param {nunber} deleteAfter delete after a specified time
   */
  async embedToChannel(channel, embed, prepend, deleteAfter) {
    if (channel && ((channel.type === 'text' && channel.permissionsFor(this.client.user.id)
      .has(['SEND_MESSAGES', 'EMBED_LINKS'])) || channel.type === 'dm')) {
      const msg = await channel.send(prepend, { embed });
      if (msg.deletable && deleteAfter > 0) {
        const deleteExpired = await this.settings.getChannelSetting(channel, 'deleteExpired') === '1';
        if (deleteExpired) {
          msg.delete({ timeout: deleteAfter });
        }
      }
    }
  }

  /**
   * Send a message, with options to delete messages after calling
   * @param {Message} message original message being responded to
   * @param {string} content String to send to a channel
   * @param {boolean} deleteResponse True to delete the sent message after time
   * @returns {Promise<Message>}
   */
  async sendDirectMessageToAuthor(message, content, deleteResponse) {
    const msg = await message.author.send(content);
    return this.deleteCallAndResponse(message, msg, false, deleteResponse);
  }

  /**
   * Send a message, with options to delete messages after calling
   * @param {TextChannel} user user being sent a message
   * @param {string} content String to send to a channel
   * @param {boolean} deleteResponse True to delete the sent message after time
   * @returns {Promise<Message>}
   */
  async sendDirectMessageToUser(user, content) {
    try {
      return user.send(content);
    } catch (e) {
      this.logger.error(e.message);
      return undefined;
    }
  }

  /**
   * Send a message, with options to delete messages after calling
   * @param {Message} message original message being responded to
   * @param {Object} embed Embed object to send
   * @param {boolean} deleteResponse True to delete the sent message after time
   * @returns {Promise<Message>}
   */
  async sendDirectEmbedToAuthor(message, embed, deleteResponse) {
    const msg = await message.author.send('', { embed });
    return this.deleteCallAndResponse(message, msg, false, deleteResponse);
  }

  async sendDirectEmbedToOwner(embed) {
    return this.client.users.get(this.owner).send('', { embed });
  }

  async sendFileToAuthor(message, file, fileName, deleteCall) {
    const msg = await message.author.send('', { files: [{ attachment: file, name: fileName }] });
    return this.deleteCallAndResponse(message, msg, deleteCall, false);
  }

  async sendFile(message, prepend, file, fileName, deleteCall) {
    const msg = await message.channel.send(prepend || '', { files: [{ attachment: file, name: fileName }] });
    return this.deleteCallAndResponse(message, msg, deleteCall, false);
  }

  /**
   * Notify channel of settings change if enabled
   * @param {Message} message Message to reply to and fetch channel settings from
   * @param {boolean} deleteOriginal whether or not to delete the original message
   * @param {boolean} deleteResponse whether or not to delete the response message
   * @returns {null|Promise<Message>}
   */
  async notifySettingsChange(message, deleteOriginal, deleteResponse) {
    await message.react('\u2705');
    const respondToSettings = await this.settings.getChannelSetting(message.channel, 'respond_to_settings') === '1';

    if (respondToSettings) {
      const msg = await message.reply('Settings updated');
      return this.deleteCallAndResponse(message, msg, deleteOriginal, deleteResponse);
    }
    return null;
  }

  /**
   * Delete call and response for a command, depending on settings
   * @param  {Message} call           calling command
   * @param  {Message} response       response message
   * @param  {boolean} deleteCall     whether or not to delete the calling message
   * @param  {boolean} deleteResponse whether or not to delete the message response
   */
  async deleteCallAndResponse(call, response, deleteCall, deleteResponse) {
    if (call && call.channel) {
      const deleteAfterRespond = await this.settings.getChannelSetting(call.channel, 'delete_after_respond') === '1';
      if (deleteAfterRespond && deleteCall && call.deletable) {
        call.delete({ timeout: 10000 });
      }
    }
    const deleteResponseAfterRespond = await this.settings.getChannelSetting(response.channel, 'delete_response') === '1';
    if (deleteResponseAfterRespond && deleteResponse && response.deletable) {
      response.delete({ timeout: 30000 });
    }
  }

  async webhook(ctx, { text, embed = undefined }) {
    if (ctx.webhook && ctx.webhook.id && ctx.webhook.token) {
      const client = new this.discord.WebhookClient(ctx.webhook.id, ctx.webhook.token);
      try {
        const embedCopy = Object.assign({}, embed);
        if (ctx.webhook.avatar) {
          embedCopy.displayAvatarURL = ctx.webhook.avatar;
        }
        if (ctx.webhook.name) {
          embedCopy.username = ctx.webhook.name;
        }
        const msg = await client.send(text, embedCopy);
        if (msg.deletable && ctx.deleteAfterDuration > 0) {
          const deleteExpired = await this.settings.getChannelSetting(ctx.channel, 'deleteExpired') === '1';
          if (deleteExpired) {
            msg.delete({ timeout: ctx.deleteAfterDuration });
          }
        }
        return msg;
      } catch (e) {
        this.logger.error(e);
        await this.settings.deleteWebhooksForChannel(ctx.channel.id);
        this.logger.error(`Could not send webhook for ${ctx.channel.id} attempting after wiping context.`);
        return false;
      }
    }
    const channelWebhook = await this.settings.getChannelWebhook(ctx.channel);
    if (channelWebhook && channelWebhook.token && channelWebhook.id) {
      // eslint-disable-next-line no-param-reassign
      ctx.webhook = channelWebhook;
      return this.webhook(ctx, { text, embed });
    }
    if (ctx.channel && ctx.channel.permissionsFor(this.client.user.id).has('MANAGE_WEBHOOKS')) {
      const webhooks = await ctx.channel.fetchWebhooks();
      let webhook;
      if (webhooks.array().length > 0) {
        [webhook] = webhooks.array();
      } else {
        webhook = await ctx.channel.createWebhook(this.client.user.username);
      }
      this.logger.debug(`Created and adding ${webhook} to ${ctx.channel}`);
      webhook.name = this.client.user.username;
      webhook.avatar = this.client.user.displayAvatarURL().replace('?size=2048', '');
      // Make this one query
      await this.settings.setChannelWebhook(ctx.channel, webhook);
      // eslint-disable-next-line no-param-reassign
      ctx.webhook = webhook;
      return this.webhook(ctx, { text, embed });
    }
    if (ctx.message) {
      if (embed) {
        return Promise.all(embed.embeds
          .map(subEmbed => this.embed(ctx.message, subEmbed, ctx.deleteCall, ctx.deleteResponse)));
      }
      return this.reply(ctx.message, text, ctx.deleteCall, ctx.deleteResponse);
    }
    return Promise.all(embed.embeds
      .map(subEmbed => this.embedToChannel(ctx.channel, subEmbed, text, ctx.deleteAfterDuration)));
  }

  webhookWrapEmbed(embed, ctx) {
    return {
      username: ctx.webhoook && ctx.webhook.name ? ctx.webhook.name : this.client.user.username,
      avatarURL: ctx.webhoook && ctx.webhook.avatar
        ? ctx.webhook.avatar : this.client.user.displayAvatarURL(),
      embeds: [embed],
    };
  }

  webhookWrapEmbeds(embeds, ctx) {
    return {
      username: ctx.webhoook && ctx.webhook.name ? ctx.webhook.name : this.client.user.username,
      avatarURL: ctx.webhoook && ctx.webhook.avatar
        ? ctx.webhook.avatar : this.client.user.displayAvatarURL(),
      embeds,
    };
  }
}

module.exports = MessaageManager;
