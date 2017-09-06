'use strict';

const Command = require('../../Command.js');

/**
 * Get a role from the matching string
 * @param  {string} string      String to use to search for role
 * @param  {Message} message    originating message
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
 * Add a joinable role
 */
class AddRole extends Command {
  constructor(bot) {
    super(bot, 'settings.addRole', 'add role');
    this.usages = [
      { description: 'Show instructions for adding joinable roles', parameters: [] },
      { description: 'Add a role', parameters: ['Role/Role id to add'] },
    ];
    this.regex = new RegExp(`^${this.call}\\s?(.*)?`, 'i');
    this.requiresAuth = true;
    this.allowDM = false;
  }

  /**
   * Run the command
   * @param {Message} message Message with a command to handle, reply to,
   *                          or perform an action based on parameters.
   */
  async run(message) {
    const stringRole = message.strippedContent.replace(`${this.call} `, '');
    if (!stringRole) {
      await this.sendInstructionEmbed(message);
    } else {
      const role = getRoleForString(stringRole, message);
      if (!role) {
        await this.sendInstructionEmbed(message);
      } else {
        const roles = await this.bot.settings.getRolesForGuild(message.guild);
        const filteredRoles = roles.filter(storedRole => role.id === storedRole.id);
        if (filteredRoles.length > 0) {
          await this.sendAlreadyAddedEmbed(message);
        } else {
          const rolesToCommit = roles.map(innerRole => innerRole.id);
          rolesToCommit.push(role.id);
          await this.addAndCommitRole(message, rolesToCommit, role.name);
        }
      }
    }
  }

  async addAndCommitRole(message, roles, newRole) {
    this.bot.settings.setRolesForGuild(message.guild, roles);
    await this.messageManager.embed(message, {
      title: 'Added role to joinable list',
      type: 'rich',
      color: 0x779ECB,
      fields: [
        {
          name: '_ _',
          value: newRole,
          inline: true,
        },
      ],
    }, true, true);
  }

  async sendAlreadyAddedEmbed(message) {
    await this.messageManager.embed(message, {
      title: 'Invalid Role',
      type: 'rich',
      color: 0x779ECB,
      fields: [
        {
          name: '_ _',
          value: 'That role is already joinable.',
          inline: true,
        },
      ],
    }, true, true);
  }

  async sendInstructionEmbed(message) {
    const prefix = await this.bot.settings.getChannelPrefix(message.channel);
    this.messageManager.embed(message, {
      title: 'Usage',
      type: 'rich',
      color: 0x779ECB,
      fields: [
        {
          name: `${prefix}${this.call} <role or role id>`,
          value: 'Role or role id to be allowed for self-role.',
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

module.exports = AddRole;
