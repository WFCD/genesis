'use strict';

const Discord = require('discord.js');
const fetch = require('node-fetch');
const Command = require('../../models/Command.js');

/**
 * Add a joinable role
 */
class Dump extends Command {
  constructor(bot) {
    super(bot, 'utilities.dump', 'dump');
    this.usages = [
      { description: 'Dump a channel config to a channel', parameters: ['JSON configuration file'] },
    ];
    this.requiresAuth = true;
    this.allowDM = false;
  }

  /**
   * Run the command
   * @param {Message} message Message with a command to handle, reply to,
   *                          or perform an action based on parameters.
   * @returns {string} success status
   */
  async run(message) {
    if (message.attachments.first() && message.member.hasPermission('ADMINISTRATOR')) {
      const firstAttach = message.attachments.first();
      if (firstAttach.filename.indexOf('.json') === -1) {
        return this.messageManager.statuses.FAILURE;
      }
      let channelConfig;

      try {
        const reqRes = await fetch(firstAttach.url).then(data => data.json());

        channelConfig = JSON.parse(reqRes);
      } catch (e) {
        message.reply('Couldn\'t get file.');
        this.logger.error(e);
        message.delete(30);
        return this.messageManager.statuses.FAILURE;
      }

      try {
        const tokens = channelConfig.messages;
        if (channelConfig.target) {
          let target = this.bot.client.channels
            .get(channelConfig.target.channel || message.channel.id);
          if (!(message.guild && message.guild.channels.has(target.id))) {
            message.reply('Channel Not Accessible');
            message.delete(30);
            return this.messageManager.statuses.FAILURE;
          }
          if (channelConfig.target.webhook
            && channelConfig.target.webhook.id
            && channelConfig.target.webhook.token) {
            target = new Discord.WebhookClient(
              channelConfig.target.webhook.id,
              channelConfig.target.webhook.token,
            );
          }

          if (channelConfig.cleanFirst) {
            const chnl = this.bot.client.channels.get(channelConfig.target.channel);
            if (chnl.messages.size > 1) {
              await chnl.bulkDelete(tokens.length);
            }
          }
          for (const token of tokens) {
            switch (token.type) {
              case 'text':
                await target.send(token.content);
                break;
              case 'img':
                await target.send({
                  files: [{
                    attachment: token.content,
                    name: token.name,
                  }],
                });
                break;
              default:
                break;
            }
          }
        }
      } catch (e) {
        this.logger.error(e.message);
        message.reply('Bad File');
        message.delete(30);
        return this.messageManager.statuses.FAILURE;
      }
      message.delete(30);
      return this.messageManager.statuses.SUCCESS;
    }
    return this.messageManager.statuses.FAILURE;
  }
}

module.exports = Dump;
