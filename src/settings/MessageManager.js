'use strict';

const Promise = require('bluebird');

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
        message.channel.permissionsFor(this.client.user.id).has('SEND_MESSAGES'))
        || message.channel.type === 'dm') {
      promises.push(message.channel.send(`${this.zSWC}${content}`).then((msg) => {
        this.deleteCallAndResponse(message, msg, deleteOriginal, deleteResponse);
      }));
    }
    Promise.each(promises, () => {}).catch(this.logger.error);
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
        message.channel.permissionsFor(this.client.user.id).has('SEND_MESSAGES'))
        || message.channel.type === 'dm') {
      return message.channel.send(`${this.zSWC}${content}`).then((msg) => {
        this.deleteCallAndResponse(message, msg, deleteOriginal, deleteResponse);
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
        message.channel.permissionsFor(this.client.user.id).has('SEND_MESSAGES'))
        || message.channel.type === 'dm') {
      promises.push(message.reply(`${this.zSWC}${content}`).then((msg) => {
        this.deleteCallAndResponse(message, msg, deleteOriginal, deleteResponse);
      }));
    }
    Promise.each(promises, () => {}).catch(this.logger.error);
  }

  /**
   * Send an embed, with options to delete messages after calling
   * @param {Message} message original message being responded to
   * @param {Object} embed Embed object to send
   * @param {boolean} deleteOriginal True to delete the original message
   * @param {boolean} deleteResponse True to delete the sent message after time
   */
  embed(message, embed, deleteOriginal, deleteResponse) {
    const promises = [];
    if ((message.channel.type === 'text' &&
      message.channel.permissionsFor(this.client.user.id)
        .has(['SEND_MESSAGES', 'EMBED_LINKS']))
      || message.channel.type === 'dm') {
      promises.push(message.channel.send('', { embed }).then((msg) => {
        this.deleteCallAndResponse(message, msg, deleteOriginal, deleteResponse);
      }));
    }
    Promise.each(promises, () => {}).catch(this.logger.error);
  }

  /**
   * Send an embed
   * @param {Channel} channel channel to send message to
   * @param {Object} embed Embed object to send
   * @param {string} prepend String to prepend to the embed
   * @param {nunber} deleteAfter delete after a specified time
   * @returns {Promise<Message>}
   */
  embedToChannel(channel, embed, prepend, deleteAfter) {
    if (channel
      && ((channel.type === 'text'
      && channel.permissionsFor(this.client.user.id).has(['SEND_MESSAGES', 'EMBED_LINKS']))
      || channel.type === 'dm')) {
      return channel.send(prepend, { embed })
        .then((msg) => {
          if (msg.deletable && deleteAfter > 0) {
            this.settings.getChannelSetting(channel, 'deleteExpired')
              .then((deleteExpired) => {
                if (parseInt(deleteExpired, 10)) {
                  msg.delete(deleteAfter);
                }
              });
          }
        });
    }
    return null;
  }

  /**
   * Send a message, with options to delete messages after calling
   * @param {Message} message original message being responded to
   * @param {string} content String to send to a channel
   * @param {boolean} deleteResponse True to delete the sent message after time
   */
  sendDirectMessageToAuthor(message, content, deleteResponse) {
    const promises = [];
    promises.push(message.author.send(content).then((msg) => {
      this.deleteCallAndResponse(message, msg, false, deleteResponse);
    }));
    Promise.each(promises, () => {}).catch(this.logger.error);
  }

  /**
   * Send a message, with options to delete messages after calling
   * @param {TextChannel} user user being sent a message
   * @param {string} content String to send to a channel
   * @param {boolean} deleteResponse True to delete the sent message after time
   */
  sendDirectMessageToUser(user, content, deleteResponse) {
    const promises = [];
    promises.push(user.send(content).then((msg) => {
      this.deleteCallAndResponse(user, msg, false, deleteResponse);
    }));
    Promise.each(promises, () => {}).catch(this.logger.error);
  }

  /**
   * Send a message, with options to delete messages after calling
   * @param {Message} message original message being responded to
   * @param {Object} embed Embed object to send
   * @param {boolean} deleteResponse True to delete the sent message after time
   */
  sendDirectEmbedToAuthor(message, embed, deleteResponse) {
    const promises = [];
    promises.push(message.author.send('', { embed }).then((msg) => {
      this.deleteCallAndResponse(message, msg, false, deleteResponse);
    }));
    Promise.each(promises, () => {}).catch(this.logger.error);
  }

  sendDirectEmbedToOwner(embed) {
    this.client.users.get(this.owner).send('', { embed }).catch(this.logger.error);
  }

  sendFileToAuthor(message, file, fileName, deleteCall) {
    message.author.send('', { file: { attachment: file, name: fileName } })
      .then((msg) => {
        this.deleteCallAndResponse(message, msg, deleteCall, false);
      });
  }

  sendFile(message, prepend, file, fileName, deleteCall) {
    message.channel.send(prepend || '', { file: { attachment: file, name: fileName } })
      .then((msg) => {
        this.deleteCallAndResponse(message, msg, deleteCall, false);
      });
  }

  /**
   * Notify channel of settings change if enabled
   * @param {Message} message Message to reply to and fetch channel settings from
   * @param {boolean} deleteOriginal whether or not to delete the original message
   * @param {boolean} deleteResponse whether or not to delete the response message
   */
  notifySettingsChange(message, deleteOriginal, deleteResponse) {
    message.react('\u2705');
    this.settings.getChannelResponseToSettings(message.channel)
      .then((respondToSettings) => {
        if (respondToSettings === '1') {
          return message.reply('Settings updated')
            .then((msg) => {
              this.deleteCallAndResponse(message, msg, deleteOriginal, deleteResponse);
            });
        }
        return new Promise(resolve => resolve(true));
      })
      .catch(this.logger.error);
  }

  /**
   * Delete call and response for a command, depending on settings
   * @param  {Message} call           calling command
   * @param  {Message} response       response message
   * @param  {boolean} deleteCall     whether or not to delete the calling message
   * @param  {boolean} deleteResponse whether or not to delete the message response
   */
  deleteCallAndResponse(call, response, deleteCall, deleteResponse) {
    if (call.channel) {
      this.settings.getChannelDeleteAfterResponse(call.channel)
        .then((deleteAfterRespond) => {
          if (deleteAfterRespond === '1') {
            if (deleteCall && call.deletable) {
              call.delete(10000).catch(() => this.logger.error(`Couldn't delete ${call}`));
            }
            if (deleteResponse && response.deletable) {
              response.delete(10000).catch(() => this.logger.error(`Couldn't delete ${response}`));
            }
          }
        })
        .catch(this.logger.error);
    }
  }

  webhook(webhookId, embed) {
    this.bot.client.fetchWebhook(webhookId).sendSlackMessage({
      username: this.bot.client.user.username,
      attachments: [embed],
    })
    .catch(this.logger.error);
  }
}

module.exports = MessaageManager;
