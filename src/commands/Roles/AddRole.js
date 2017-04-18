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
  const roleFromId = this.client.roles.get(trimmedString);
  let roleFromName;
  if (typeof roleFromId === 'undefined') {
    roleFromName = message.guild.roles.find('name', trimmedString);
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
               this.sendAlreadyAddedEmbed(message);
             } else {
               this.addAndCommitRole(message, roles.push(filteredRoles[0]));
             }
           })
           .catch(this.logger.error);
      }
    }
  }

  addAndCommitRole(message, roles) {
    this.settings.setRolesForGuild(message.guild, roles);
  }

  sendAlreadyAddedEmbed(message) {
    this.messageManager.embed(message, {
      title: 'Invalid Role',
      type: 'rich',
      color: 0x0000ff,
      fields: [
        {
          name: '_ _',
          value: 'That role is already joinable.',
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
      }, true, false))
      .catch(this.logger.error);
  }
}

module.exports = AddRole;
