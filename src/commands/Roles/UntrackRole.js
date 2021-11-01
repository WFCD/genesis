'use strict';

const Command = require('../../models/Command.js');
const { captures: { role: rc } } = require('../../CommonFunctions');

class UntrackRole extends Command {
  /**
   * Constructs a callable command
   * @param {Genesis} bot  The bot object
   */
  constructor(bot) {
    super(bot, 'settings.roles.untrack', 'r untrack', 'Untrack a role in a server', 'UTIL');
    this.requiresAuth = true;
    this.allowDM = false;
    this.regex = new RegExp(`^${this.call} ${rc}`, 'i');
    this.usages = [
      {
        description: 'Remove an existing role channel binding',
        parameters: ['channel', 'role'],
      },
    ];
  }

  async run(message) {
    const { guild } = message;

    const roleId = (message.strippedContent.match(rc) || [])[0]
      .replace('<@&', '')
      .replace('>', '');

    if (!roleId) return this.messageManager.statuses.FAILURE;
    const role = guild.roles.cache.get(roleId);
    if (!role) return this.messageManager.statuses.FAILURE;

    await this.settings.untrackRole(guild, role);
    this.messageManager.notifySettingsChange(message, true, true);
    return this.messageManager.statuses.SUCCESS;
  }
}

module.exports = UntrackRole;
