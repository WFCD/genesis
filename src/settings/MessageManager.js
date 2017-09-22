'use strict';

/**
 * MessageManager for
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
   */
  async sendMessage(message, content, deleteOriginal, deleteResponse) {
    if ((message.channel.type === 'text' &&
        message.channel.permissionsFor(this.client.user.id).has('SEND_MESSAGES'))
        || message.channel.type === 'dm') {
      const msg = await message.channel.send(`${this.zSWC}${content}`);
      await this.deleteCallAndResponse(message, msg, deleteOriginal, deleteResponse);
    }
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
    if ((message.channel.type === 'text' &&
        message.channel.permissionsFor(this.client.user.id).has('SEND_MESSAGES'))
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
    if ((message.channel && message.channel.type === 'text' &&
        message.channel.permissionsFor(this.client.user.id).has('SEND_MESSAGES'))
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
    if ((message.channel.type === 'text' &&
      message.channel.permissionsFor(this.client.user.id)
        .has(['SEND_MESSAGES', 'EMBED_LINKS']))
      || message.channel.type === 'dm') {
      const msg = await message.channel.send(content || '', { embed });
      return this.deleteCallAndResponse(message, msg, deleteOriginal, deleteResponse);
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
    if (channel && ((channel.type === 'text' && channel.permissionsFor(this.client.user.id).has(['SEND_MESSAGES', 'EMBED_LINKS'])) || channel.type === 'dm')) {
      const msg = await channel.send(prepend, { embed });
      if (msg.deletable && deleteAfter > 0) {
        const deleteExpired = await this.settings.getChannelSetting(channel, 'deleteExpired');
        if (parseInt(deleteExpired, 10)) {
          msg.delete(deleteAfter);
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
  async sendDirectMessageToUser(user, content, deleteResponse) {
    const msg = await user.send(content);
    return this.deleteCallAndResponse(user, msg, false, deleteResponse);
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
    const msg = await message.author.send('', { file: { attachment: file, name: fileName } });
    return this.deleteCallAndResponse(message, msg, deleteCall, false);
  }

  async sendFile(message, prepend, file, fileName, deleteCall) {
    const msg = await message.channel.send(prepend || '', { file: { attachment: file, name: fileName } });
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
    const respondToSettings = await this.settings.getChannelSetting(message.channel, 'respond_to_settings');

    if (respondToSettings === '1') {
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
      const deleteAfterRespond = await this.settings.getChannelSetting(call.channel, 'delete_after_respond');
      const deleteResponseAfterRespond = await this.settings.getChannelSetting(call.channel, 'delete_response');
      if (deleteAfterRespond === '1' && deleteCall && call.deletable) {
        call.delete(10000);
      }
      if (deleteResponseAfterRespond === '1' && deleteResponse && response.deletable) {
        response.delete(30000);
      }
    }
  }

  async webhook(webhookId, embed) {
    this.bot.client.fetchWebhook(webhookId).sendSlackMessage({
      username: this.bot.client.user.username,
      attachments: [embed],
    })
    .catch(this.logger.error);
  }
}

module.exports = MessaageManager;
