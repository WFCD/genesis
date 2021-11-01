'use strict';

const Command = require('../../models/Command.js');

/**
 * Get a role from the matching string
 * @param  {string} string      String to use to search for role
 * @param  {Message} message    Originating message
 * @returns {Role|null}         Role
 */
function getRoleForString(string, message) {
  const trimmedString = string.trim();
  const roleFromId = message.guild.roles.cache.get(trimmedString);
  let roleFromName;
  if (typeof roleFromId === 'undefined') {
    roleFromName = message.guild.roles.cache
      .find(item => item.name.toLowerCase() === trimmedString.toLowerCase());
  }
  return roleFromId || roleFromName || null;
}

const deleteRegex = new RegExp('--delete', 'ig');

/**
 * Remove a joinable role
 */
class RemoveRole extends Command {
  constructor(bot) {
    super(bot, 'settings.removeRole', 'remove role', 'Remove role from joinable system', 'UTIL');
    this.usages = [
      { description: 'Show instructions for removing joinable roles', parameters: [] },
      { description: 'Remove a role', parameters: ['Role/Role id to add', '--delete'] },
    ];
    this.regex = new RegExp(`^${this.call}\\s?(.*)?`, 'i');
    this.requiresAuth = true;
    this.allowDM = false;
  }

  async run(message) {
    const stringRole = message.strippedContent.replace(`${this.call} `, '').replace('--delete', '').trim();
    if (!stringRole) {
      await this.sendInstructionEmbed(message);
      return this.messageManager.statuses.FAILURE;
    }
    const role = getRoleForString(stringRole, message);
    if (!role) {
      await this.sendInstructionEmbed(message);
      return this.messageManager.statuses.FAILURE;
    }
    const roles = await this.settings.getRolesForGuild(message.guild);
    const filteredRoles = roles.filter(storedRole => role.id === storedRole.id);
    if (filteredRoles.length > 0) {
      const deleteRole = deleteRegex.test(message.strippedContent);
      this.removeAndCommitRoles(message, roles
        .filter(storedRole => filteredRoles[0].id !== storedRole.id)
        .map(unSelectedRole => unSelectedRole.getSimple()), filteredRoles[0]);
      if (deleteRole) {
        message.guild.roles.cache.get(filteredRoles[0].id).delete('Deleting role from role remove');
      }
      return this.messageManager.statuses.SUCCESS;
    }
    await this.sendRoleNotAvailable(message);
    return this.messageManager.statuses.FAILURE;
  }

  async removeAndCommitRoles(message, roles, newRole) {
    await this.settings.setRolesForGuild(message.guild, roles.map(role => JSON.stringify(role)));
    const embed = {
      title: 'Removed role from joinable list',
      type: 'rich',
      color: 0x779ECB,
      description: newRole.guildRole.name,
    };
    await message.reply({ embeds: [embed] });
  }

  // eslint-disable-next-line class-methods-use-this
  async sendRoleNotAvailable(message) {
    await message.reply({
      embeds: [{
        title: 'Invalid Role',
        type: 'rich',
        color: 0x0000ff,
        description: 'That role is unavailable to be removed.',
      }],
    });
  }

  async sendInstructionEmbed(message) {
    const prefix = await this.settings.getGuildSetting(message.guild, 'prefix');
    await message.reply({
      embeds: [{
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
            value: '\u200B',
          },
          {
            name: '**Roles:**',
            value: message.guild.roles.cache.map(r => r.name).join('; '),
            inline: true,
          },
        ],
      }],
    });
  }
}

module.exports = RemoveRole;
