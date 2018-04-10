'use strict';

const Command = require('../../models/Command.js');

class DeleteDefaultRole extends Command {
  constructor(bot) {
    super(bot, 'settings.deleteDefaultRole', 'delete default role');
    this.usages = [
      { description: 'Add a new default role for persons joining the server.', parameters: ['message'] },
    ];
    this.regex = new RegExp(`^${this.call}\\s?(\\d+)?$`, 'i');
    this.requiresAuth = true;
    this.allowDM = false;
  }

  async run(message) {
    const roleId = message.strippedContent.match(this.regex)[1];
    if (roleId && message.guild.roles.has(roleId.trim())) {
      const roles = JSON.parse(await this.settings.getGuildSetting(message.guild, 'defaultRoles') || '[]');
      if (roles.includes(roleId)) {
        roles.splice(roles.indexOf(roleId, 1));
        await this.settings.setGuildSetting(message.guild, 'defaultRoles', JSON.stringify(roles));
        this.messageManager.notifySettingsChange(message, true, true);
        return this.messageManager.statuses.SUCCESS;
      }
    }
    await this.messageManager.reply(message, 'you must provide a valid role id that corresponds to a role that is already added.');
    return this.messageManager.statuses.FAILURE;
  }
}

module.exports = DeleteDefaultRole;
