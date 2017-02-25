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
  }

  /**
   * Send a message, with options to delete messages after calling
   * @param {Message} message original message being responded to
   * @param {string} content String to send to a channel
   * @param {boolean} deleteOriginal True to delete the original message
   * @param {boolean} deleteResponse True to delete the sent message after time
   */
  sendMessage(message, content, deleteOriginal, deleteResponse) {
    const promises = [];
    if ((message.channel.type === 'text' &&
        message.channel.permissionsFor(this.client.user.id).hasPermission('SEND_MESSAGES'))
        || message.channel.type === 'dm') {
      promises.push(message.channel.sendMessage(`${this.zSWC}${content}`).then((msg) => {
        if (deleteOriginal && message.deletable) {
          promises.push(message.delete(10000));
        }
        if (deleteResponse && msg.deletable) {
          promises.push(msg.delete(10000));
        }
      }));
    }

    promises.forEach(promise => promise.catch(this.logger.error));
  }

  /**
   * Send a message, with options to delete messages after calling
   * @param {Message} message original message being responded to
   * @param {string} content String to send to a channel
   * @param {boolean} deleteOriginal True to delete the original message
   * @param {boolean} deleteResponse True to delete the sent message after time
   * @returns {null|Promise<Message>}
   */
  replyMessageRetPromise(message, content, deleteOriginal, deleteResponse) {
    if ((message.channel.type === 'text' &&
        message.channel.permissionsFor(this.client.user.id).hasPermission('SEND_MESSAGES'))
        || message.channel.type === 'dm') {
      return message.channel.sendMessage(`${this.zSWC}${content}`).then((msg) => {
        if (deleteOriginal && message.deletable) {
          message.delete(10000).catch(this.logger.error);
        }
        if (deleteResponse && msg.deletable) {
          msg.delete(10000).catch(this.logger.error);
        }
      });
    }
    return null;
  }

  /**
   * Send a message, with options to delete messages after calling
   * @param {Message} message original message being responded to
   * @param {string} content String to send to a channel
   * @param {boolean} deleteOriginal True to delete the original message
   * @param {boolean} deleteResponse True to delete the sent message after time
   */
  reply(message, content, deleteOriginal, deleteResponse) {
    const promises = [];
    if ((message.channel.type === 'text' &&
        message.channel.permissionsFor(this.client.user.id).hasPermission('SEND_MESSAGES'))
        || message.channel.type === 'dm') {
      promises.push(message.reply(`${this.zSWC}${content}`).then((msg) => {
        if (deleteOriginal && message.deletable) {
          promises.push(message.delete(10000));
        }
        if (deleteResponse && msg.deletable) {
          promises.push(msg.delete(10000));
        }
      }));
    }

    promises.forEach(promise => promise.catch(this.logger.error));
  }

  /**
   * Send a message, with options to delete messages after calling
   * @param {Message} message original message being responded to
   * @param {Object} embed Embed object to send
   * @param {boolean} deleteOriginal True to delete the original message
   * @param {boolean} deleteResponse True to delete the sent message after time
   */
  embed(message, embed, deleteOriginal, deleteResponse) {
    const promises = [];
    if ((message.channel.type === 'text' &&
      message.channel.permissionsFor(this.client.user.id).hasPermissions(['SEND_MESSAGES', 'EMBED_LINKS']))
      || message.channel.type === 'dm') {
      promises.push(message.channel.sendEmbed(embed).then((msg) => {
        if (deleteOriginal && message && message.deletable) {
          promises.push(message.delete(10000));
        }
        if (deleteResponse && msg && msg.deletable) {
          promises.push(msg.delete(10000));
        }
      }));
    }
    promises.forEach(promise => promise.catch(this.logger.error));
  }

  /**
   * Send a message, with options to delete messages after calling
   * @param {Message} message original message being responded to
   * @param {string} content String to send to a channel
   * @param {boolean} deleteResponse True to delete the sent message after time
   */
  sendDirectMessageToAuthor(message, content, deleteResponse) {
    const promises = [];
    promises.push(message.author.sendMessage(content).then((msg) => {
      if (deleteResponse && msg.deletable) {
        promises.push(msg.delete(10000));
      }
    }));

    promises.forEach(promise => promise.catch(this.logger.error));
  }

  /**
   * Send a message, with options to delete messages after calling
   * @param {Message} message original message being responded to
   * @param {Object} embed Embed object to send
   * @param {boolean} deleteResponse True to delete the sent message after time
   */
  sendDirectEmbedToAuthor(message, embed, deleteResponse) {
    const promises = [];
    promises.push(message.author.sendEmbed(embed).then((msg) => {
      if (deleteResponse && msg && msg.deletable) {
        promises.push(msg.delete(10000));
      }
    }));
    promises.forEach(promise => promise.catch(this.logger.error));
  }

  sendDirectEmbedToOwner(embed) {
    this.client.get(this.owner).sendEmbed(embed).catch(this.logger.error);
  }

  /**
   * Notify channel of settings change if enabled
   * @param {Message} message Message to reply to and fetch channel settings from
   * @param {boolean} deleteOriginal whether or not to delete the original message
   * @param {boolean} deleteResponse whether or not to delete the response message
   */
  notifySettingsChange(message, deleteOriginal, deleteResponse) {
    const promises = [];
    message.react('\u2705');
    this.settings.getChannelResponseToSettings(message.channel)
      .then((respondToSettings) => {
        if (respondToSettings) {
          promises.push(message.reply('Settings updated')
            .then((msg) => {
              if (deleteResponse && msg.deletable) {
                promises.push(msg.delete(5000));
              }
            }));
        }
        if (deleteOriginal && message.deletable) {
          promises.push(message.delete(5000));
        }
      })
      .catch(this.logger.error);
  }
}

module.exports = MessaageManager;
