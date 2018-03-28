'use strict';

const Command = require('../../Command.js');

class SetDefaultCategory extends Command {
  constructor(bot) {
    super(bot, 'settings.defaultcategory', 'set rooms category', 'Set whether or not to the bot should default rooms to being unlocked (public).');
    this.usages = [
      { description: 'Change the bot\'s default category for temp rooms. Defaults to none.', parameters: ['temp room default'] },
    ];
    this.regex = new RegExp(`^${this.call}\\s?(\\d+)?$`, 'i');
    this.requiresAuth = true;
    this.allowDM = false;
  }

  /**
   * Run the command
   * @param {Message} message Message with a command to handle, reply to,
   *                          or perform an action based on parameters.
   * @param {Object} ctx Command context for calling commands
   * @returns {string} success status
   */
  async run(message, ctx) {
    const category = message.strippedContent.match(this.regex)[1];
    if (category && this.bot.client.channels.has(category.trim())) {
      await this.bot.settings.setGuildSetting(message.guild, 'tempCategory', category);
      this.messageManager.notifySettingsChange(message, true, true);
      return this.messageManager.statuses.SUCCESS;
    }
    const embed = {
      title: 'Usage',
      type: 'rich',
      color: 0x0000ff,
      fields: [
        {
          name: `${ctx.prefix}${this.call} <category id>`,
          value: '_ _',
        },
      ],
    };
    this.messageManager.embed(message, embed, true, true);
    return this.messageManager.statuses.FAILURE;
  }
}

module.exports = SetDefaultCategory;
