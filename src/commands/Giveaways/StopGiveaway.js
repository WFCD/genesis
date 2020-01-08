'use strict';

const giveaways = require('discord-giveaways');
const Command = require('../../models/Command.js');

const { captures: { channel: cc } } = require('../../CommonFunctions');


class StopGiveaway extends Command {
  constructor(bot) {
    super(bot, 'giveaways.stop', 'g stop', 'Stop a Giveaway', 'GIVEAWAYS');
    this.requiresAuth = true;
    this.allowDM = false;
    this.regex = new RegExp(`^${this.call}\\s${cc}`, 'i');
    this.usages = [
      {
        description: 'Stop a giveaway.',
        parameters: ['giveaway message id'],
      },
    ];
  }

  /**
   * Run the command
   * @param {Message} message Message with a command to handle, reply to,
   *                          or perform an action based on parameters.
   * @returns {string} success status
   */
  async run(message) {
    let mid;
    try {
      [mid] = message.strippedContent.replace(this.call, '').trim().split(/ +/g);
      await giveaways.delete(mid);
      return this.messageManager.statuses.SUCCESS;
    } catch (e) {
      this.logger.error(e);
      message.reply(`Giveaway \`${mid}\` failed to stop or doesn't exist`);
      return this.messageManager.statuses.FAILURE;
    }
  }
}

module.exports = StopGiveaway;
