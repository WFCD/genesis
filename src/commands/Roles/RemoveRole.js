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
  const roleFromId = this.client.roles.get(trimmedString);
  let roleFromName;
  if (typeof roleFromId === 'undefined') {
    roleFromName = message.guild.roles.find('name', trimmedString);
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
    this.regex = new RegExp(`^${this.call}\\s(.*)?`, 'i');
    this.requiresAuth = true;
  }

  /**
   * Run the command
   * @param {Message} message Message with a command to handle, reply to,
   *                          or perform an action based on parameters.
   */
  run(message) {
    const stringRole = message.strippedContent.replace(`${this.call} `, '');
    if (!stringRole) {
      this.sendInstructionEmbed(message);
    } else {
      const role = getRoleForString(stringRole);
      if (!role) {
        this.sendInstructionEmbed(message);
      } else {
        this.bot.settings.getRolesForGuild(message.guild)
          .then((roles) => {
            const filteredRoles = roles.filter(storedRole => role.id === storedRole.id);
            if (filteredRoles.length > 0) {
              this.removeAndCommitRoles(message, roles
                .filter(storedRole => filteredRoles[0].id !== storedRole.id));
            } else {
              this.sendRoleNotAvailable(message);
            }
          })
          .catch(this.logger.error);
      }
    }
  }

  removeAndCommitRoles(message, roles) {
    this.settings.setRolesForGuild(message.guild, roles);
  }

  sendRoleNotAvailable(message) {
    this.messageManager.embed(message, {
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

  sendInstructionEmbed(message) {
    this.bot.settings.getChannelPrefix(message.channel)
      .then(prefix => this.messageManager.embed(message, {
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
      }, true, false))
      .catch(this.logger.error);
  }
}

module.exports = RemoveRole;
