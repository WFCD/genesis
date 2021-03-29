'use strict';

const Command = require('../../models/Command.js');
const { captures } = require('../../CommonFunctions');

class AddDefaultRole extends Command {
  constructor(bot) {
    super(bot, 'settings.addDefaultRole', 'add default role', 'Add a new default role for the server', 'UTIL');
    this.usages = [
      { description: 'Add a new default role for persons joining the server.', parameters: ['role id'] },
    ];
    this.regex = new RegExp(`^${this.call}\\s?${captures.role}?$`, 'i');
    this.requiresAuth = true;
    this.allowDM = false;
  }

  async run(message, ctx) {
    const roleId = message.strippedContent.match(this.regex)[1];
    if (roleId && message.guild.roles.cache.has(roleId.trim())) {
      const roles = JSON.parse(await this.settings.getGuildSetting(message.guild, 'defaultRoles') || '[]');
      if (!roles.includes(roleId)) {
        roles.push(roleId);
        await this.settings.setGuildSetting(message.guild, 'defaultRoles', JSON.stringify(roles));
        this.messageManager.notifySettingsChange(message, true, true);
        return this.messageManager.statuses.SUCCESS;
      }
    }
    await this.messageManager.reply(message, ctx.i18n`you must provide a valid role id that doesn't correspond to a role that is already added.`);
    return this.messageManager.statuses.FAILURE;
  }
}

module.exports = AddDefaultRole;
