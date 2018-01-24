'use strict';

const Command = require('../../Command.js');

class ResetGuild extends Command {
  constructor(bot) {
    super(bot, 'core.reset', 'reset');
    this.requiresAuth = true;
    this.allowDM = false;
  }

  async run(message) {
    try {
      const { guild } = message;
      await this.bot.settings.removeGuild(guild);
      await Promise.all(guild.channels.map(channel => this.bot.settings.stopTracking(channel)));
    } catch (e) {
      this.logger.error(e.message);
      return this.messageManager.statuses.FAILURE;
    }
    return this.messageManager.statuses.SUCCESS;
  }
}

module.exports = ResetGuild;
