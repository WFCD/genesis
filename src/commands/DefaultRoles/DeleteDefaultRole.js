'use strict';

const Command = require('../../models/Command.js');
const { captures } = require('../../CommonFunctions');

class DeleteDefaultRole extends Command {
  constructor(bot) {
    super(bot, 'settings.deleteDefaultRole', 'delete default role', 'Delete a default role', 'UTIL');
    this.usages = [
      { description: 'Delete a default role for persons joining the server.', parameters: ['role mention'] },
    ];
    this.regex = new RegExp(`^${this.call}\\s?${captures.role}?$`, 'i');
    this.requiresAuth = true;
    this.allowDM = false;
  }

  async run(message, ctx) {
    const roleId = message.strippedContent.match(this.regex)[1];
    if (roleId && message.guild.roles.cache.has(roleId.trim())) {
      const roles = JSON.parse(await this.settings.getGuildSetting(message.guild, 'defaultRoles') || '[]');
      if (roles.includes(roleId)) {
        roles.splice(roles.indexOf(roleId, 1));
        await this.settings.setGuildSetting(message.guild, 'defaultRoles', JSON.stringify(roles));
        this.messageManager.notifySettingsChange(message, true, true);
        return this.messageManager.statuses.SUCCESS;
      }
    }
    await message.reply({ content: ctx.i18n`you must provide a valid role id that corresponds to a role that is already added.` });
    return this.messageManager.statuses.FAILURE;
  }
}

module.exports = DeleteDefaultRole;
