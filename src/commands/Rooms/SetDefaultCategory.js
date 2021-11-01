'use strict';

const Command = require('../../models/Command.js');

class SetDefaultCategory extends Command {
  constructor(bot) {
    super(bot, 'settings.defaultcategory', 'set rooms category', 'Set whether or not to the bot should default rooms to being unlocked (public).', 'ROOMS');
    this.usages = [
      { description: 'Change the bot\'s default category for temp rooms. Defaults to none.', parameters: ['temp room default'] },
    ];
    this.regex = new RegExp(`^${this.call}\\s?(\\d+)?$`, 'i');
    this.requiresAuth = true;
    this.allowDM = false;
  }

  async run(message) {
    const category = message.strippedContent.match(this.regex)[1];
    if (category && this.bot.client.channels.cache.has(category.trim())) {
      await this.settings.setGuildSetting(message.guild, 'tempCategory', category);
      this.messageManager.notifySettingsChange(message, true, true);
      return this.messageManager.statuses.SUCCESS;
    }
    await this.settings.deleteGuildSetting(message.guild, 'tempCategory');
    this.messageManager.notifySettingsChange(message, true, true);
    return this.messageManager.statuses.SUCCESS;
  }
}

module.exports = SetDefaultCategory;
