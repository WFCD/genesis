'use strict';

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

  async run(message, ctx) {
    let mid;
    try {
      [mid] = message.strippedContent.replace(this.call, '').trim().split(/ +/g);
      await this.bot.giveaways.reroll(mid);
      return this.constructor.statuses.SUCCESS;
    } catch (e) {
      this.logger.error(e);
      await message.reply(ctx.i18n`Giveaway \`${mid}\` failed to reroll or doesn't exist`);
      return this.constructor.statuses.FAILURE;
    }
  }
}

module.exports = ReRollGiveaway;
