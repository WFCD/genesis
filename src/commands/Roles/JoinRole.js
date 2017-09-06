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
class JoinRole extends Command {
  constructor(bot) {
    super(bot, 'settings.joinRole', 'join');
    this.usages = [
      { description: 'Show instructions for joining roles', parameters: [] },
      { description: 'Joining a role', parameters: ['Role/Role id to join.'] },
    ];
    this.regex = new RegExp(`^${this.call}\\s?(.*)?`, 'i');
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
        const roleAddable = filteredRoles.length > 0
               && !message.member.roles.get(role.id)
               && message.channel.permissionsFor(this.bot.client.user.id).has('MANAGE_ROLES_OR_PERMISSIONS');
        const userHasRole = filteredRoles.length > 0
               && message.member.roles.get(role.id)
               && message.channel.permissionsFor(this.bot.client.user.id).has('MANAGE_ROLES_OR_PERMISSIONS');
        if (roleAddable) {
          await message.member.addRole(role.id);
          await this.sendJoined(message, role);
        } else {
          await this.sendCantJoin(message, userHasRole);
        }
      }
    }
  }

  async sendJoined(message, role) {
    await this.messageManager.embed(message, {
      title: 'Joined Role',
      type: 'rich',
      color: 0x779ECB,
      fields: [
        {
          name: '_ _',
          value: role.name,
          inline: true,
        },
      ],
    }, true, true);
  }


  async sendCantJoin(message, userHasRole) {
    await this.messageManager.embed(message, {
      title: 'Can\'t Join',
      type: 'rich',
      color: 0x779ECB,
      fields: [
        {
          name: '_ _',
          value: userHasRole ? 'You already have that role.' : 'You can\'t join that role.',
          inline: true,
        },
      ],
    }, true, true);
  }

  async sendInstructionEmbed(message) {
    const embed = {
      title: 'Usage',
      type: 'rich',
      color: 0x779ECB,
      fields: [
        {
          name: '_ _',
          value: 'Role or role id to join.',
        },
        {
          name: 'Possible role values:',
          value: '_ _',
        },
      ],
    };
    const prefix = await this.bot.settings.getChannelPrefix(message.channel);
    embed.fields[0].name = `${prefix}${this.call} <role or role id>`;
    const roles = await this.bot.settings.getRolesForGuild(message.guild);
    embed.fields[1].value = roles.map(role => role.name).join('; ');
    this.messageManager.embed(message, embed, true, false);
  }
}

module.exports = JoinRole;
