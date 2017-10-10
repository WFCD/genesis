'use strict';

const Command = require('../../Command.js');

class AllowPrivateRoom extends Command {
  constructor(bot) {
    super(bot, 'settings.allowprivateroom', 'allow private room', 'Set whether or not to allow the bot to create private rooms.');
    this.usages = [
      { description: 'Change if the bot is allowed to create private channels', parameters: ['private rooms enabled'] },
    ];
    this.regex = new RegExp(`^${this.call}\\s?(on|off)?$`, 'i');
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
    let enable = message.strippedContent.match(this.regex)[1];
    if (!enable) {
      const embed = {
        title: 'Usage',
        type: 'rich',
        color: 0x0000ff,
        fields: [
          {
            name: `${this.bot.prefix}${this.call} <on|off>`,
            value: '_ _',
          },
        ],
      };
      this.messageManager.embed(message, embed, true, true);
      return this.messageManager.statuses.FAILURE;
    }
    enable = enable.trim();
    await this.bot.settings.setGuildSetting(message.guild, 'createPrivateChannel', enable === 'on');
    this.messageManager.notifySettingsChange(message, true, true);
    return this.messageManager.statuses.SUCCESS;
  }
}

module.exports = AllowPrivateRoom;
