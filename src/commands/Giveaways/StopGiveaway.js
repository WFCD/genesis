'use strict';

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

  async run(message) {
    let mid;
    try {
      [mid] = message.strippedContent.replace(this.call, '').trim().split(/ +/g);
      await this.bot.giveaways.delete(mid);
      return this.constructor.statuses.SUCCESS;
    } catch (e) {
      this.logger.error(e);
      await message.reply(`Giveaway \`${mid}\` failed to stop or doesn't exist`);
      return this.constructor.statuses.FAILURE;
    }
  }
}

module.exports = StopGiveaway;
