'use strict';

const Command = require('../../Command.js');

/**
 * Get a role from the matching string
 * @param  {string} string      String to use to search for role
 * @param  {Message} message    Originating message
 * @returns {Role|null}         Role
 */
function getRoleForString(string, message) {
  const trimmedString = string.trim();
  const roleFromId = message.guild.roles.get(trimmedString);
  let roleFromName;
  if (typeof roleFromId === 'undefined') {
    roleFromName = message.guild.roles
      .find(item => item.name.toLowerCase() === trimmedString.toLowerCase());
  }
  return roleFromId || roleFromName || null;
}

/**
 * Remove a joinable role
 */
class RemoveRole extends Command {
  constructor(bot) {
    super(bot, 'settings.removeRole', 'remove role');
    this.usages = [
      { description: 'Show instructions for removing joinable roles', parameters: [] },
      { description: 'Remove a role', parameters: ['Role/Role id to add'] },
    ];
    this.regex = new RegExp(`^${this.call}\\s?(.*)?`, 'i');
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
    const stringRole = message.strippedContent.replace(`${this.call} `, '');
    if (!stringRole) {
      await this.sendInstructionEmbed(message);
      return this.messageManager.statuses.FAILURE;
    }
    const role = getRoleForString(stringRole, message);
    if (!role) {
      await this.sendInstructionEmbed(message);
      return this.messageManager.statuses.FAILURE;
    }
    const roles = await this.bot.settings.getRolesForGuild(message.guild);
    const filteredRoles = roles.filter(storedRole => role.id === storedRole.id);
    if (filteredRoles.length > 0) {
      this.removeAndCommitRoles(message, roles
        .filter(storedRole => filteredRoles[0].id !== storedRole.id)
        .map(unSelectedRole => unSelectedRole.id), filteredRoles[0]);
      return this.messageManager.statuses.SUCCESS;
    }
    await this.sendRoleNotAvailable(message);
    return this.messageManager.statuses.FAILURE;
  }

  async removeAndCommitRoles(message, roles, newRole) {
    await this.bot.settings.setRolesForGuild(message.guild, roles);
    await this.messageManager.embed(message, {
      title: 'Removed role from joinable list',
      type: 'rich',
      color: 0x779ECB,
      fields: [
        {
          name: '_ _',
          value: newRole.name,
          inline: true,
        },
      ],
    }, true, false);
  }

  async sendRoleNotAvailable(message) {
    await this.messageManager.embed(message, {
      title: 'Invalid Role',
      type: 'rich',
      color: 0x0000ff,
      fields: [
        {
          name: '_ _',
          value: 'That role is unavailable to be removed.',
          inline: true,
        },
      ],
    }, true, false);
  }

  async sendInstructionEmbed(message) {
    const prefix = await this.bot.settings.getChannelSetting(message.channel, 'prefix');
    await this.messageManager.embed(message, {
      title: 'Usage',
      type: 'rich',
      color: 0x0000ff,
      fields: [
        {
          name: `${prefix}${this.call} <role or role id>`,
          value: 'Role or role id to be disallowed for self-role.',
        },
        {
          name: 'Possible values:',
          value: '_ _',
        },
        {
          name: '**Roles:**',
          value: message.guild.roles.map(r => r.name).join('; '),
          inline: true,
        },
      ],
    }, true, true);
  }
}

module.exports = RemoveRole;
