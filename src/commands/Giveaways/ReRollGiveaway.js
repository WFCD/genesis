'use strict';

const giveaways = require('discord-giveaways');
const Command = require('../../models/Command.js');

const { captures: { channel: cc } } = require('../../CommonFunctions');


class ReRollGiveaway extends Command {
  constructor(bot) {
    super(bot, 'giveaways.reroll', 'g reroll', 'ReRoll a Giveaway', 'GIVEAWAYS');
    this.requiresAuth = true;
    this.allowDM = false;
    this.regex = new RegExp(`^${this.call}\\s${cc}`, 'i');
    this.usages = [
      {
        description: 'ReRoll a giveaway. There is currently a bug causing this to not function.',
        parameters: ['giveaway message id'],
      },
    ];
    this.enabled = false;
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
      await giveaways.reroll(mid);
      return this.messageManager.statuses.SUCCESS;
    } catch (e) {
      this.logger.error(e);
      message.reply(`Giveaway \`${mid}\` failed to reroll or doesn't exist`);
      return this.messageManager.statuses.FAILURE;
    }
  }
}

module.exports = ReRollGiveaway;
