'use strict';

const Command = require('../../models/Command.js');
const { captures } = require('../../CommonFunctions');

class SetModRole extends Command {
  constructor(bot) {
    super(bot, 'settings.setModRole', 'set mod', 'Sets the server\'s mod role.', 'LOGGING');
    this.usages = [
      { description: 'Change the configured mod role', parameters: ['mod role id'] },
    ];
    this.regex = new RegExp(`^${this.call}\\s?${captures.role}?$`, 'i');
    this.requiresAuth = true;
    this.allowDM = false;
  }

  async run(message) {
    const roleId = message.strippedContent.match(this.regex)[1];
    if (roleId && message.guild.roles.cache.has(roleId.trim())) {
      await this.settings.setGuildSetting(message.guild, 'modRole', roleId);
      this.messageManager.notifySettingsChange(message, true, true);
      return this.constructor.statuses.SUCCESS;
    }
    await this.settings.deleteGuildSetting(message.guild, 'modRole');
    this.messageManager.notifySettingsChange(message, true, true);
    return this.constructor.statuses.SUCCESS;
  }
}

module.exports = SetModRole;
