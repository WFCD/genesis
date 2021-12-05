'use strict';

const Command = require('../../models/Command.js');

/**
 * Get a role from the matching string
 * @param  {string} string      String to use to search for role
 * @param  {Message} message    originating message
 * @returns {Role|null}         Role
 */
const getRoleForString = (string, message) => {
  const trimmedString = string.trim()
    .replace(/^@(.*)/, '$1')
    .replace(/<@&(.*)>/, '$1');
  const roleFromId = message.guild.roles.cache.get(trimmedString);
  let roleFromName;
  if (typeof roleFromId === 'undefined') {
    roleFromName = message.guild.roles.cache
      .find(item => item.name.toLowerCase() === trimmedString.toLowerCase());
  }
  return roleFromId || roleFromName || undefined;
};

const determineDescription = (userHasRole, hasMinimumRole) => {
  if (userHasRole) {
    return 'You already have that role.';
  }
  if (!hasMinimumRole) {
    return 'You don\'t have the required role for that.';
  }
  return 'You can\'t join that role.';
};

/**
 * Add a joinable role
 */
class JoinRole extends Command {
  constructor(bot) {
    super(bot, 'settings.joinRole', 'join', 'Join a role', 'UTIL');
    this.usages = [
      { description: 'Show instructions for joining roles', parameters: [] },
      { description: 'Joining a role', parameters: ['Role/Role id to join.'] },
    ];
    this.regex = new RegExp(`^${this.call}\\s?(.*)?`, 'i');
    this.allowDM = false;
  }

  async run(message) {
    const stringRole = message.strippedContent.replace(`${this.call} `, '');
    if (!stringRole) {
      await this.sendInstructionEmbed(message);
      return this.constructor.statuses.FAILURE;
    }

    const role = getRoleForString(stringRole, message);
    if (!role) {
      await this.sendInstructionEmbed(message);
      return this.constructor.statuses.FAILURE;
    }

    const roles = await this.settings.getRolesForGuild(message.guild);
    const filteredRoles = roles.filter(storedRole => role.id === storedRole.id);

    const botIsHigher = message.guild.me
      .roles.highest.comparePositionTo(message.guild.roles.cache.get(role.id));

    const botHasPerm = message.channel.permissionsFor(this.bot.client.user.id).has('MANAGE_ROLES');

    const userHasRole = message.member.roles.cache.get(role.id);

    const userHasMinimumRole = (filteredRoles[0] && filteredRoles[0].requiredRole
      ? message.member.roles.has(filteredRoles[0].requiredRole)
      : true);
    const roleAddable = !userHasRole && botIsHigher
      && botHasPerm && userHasMinimumRole && filteredRoles.length > 0;

    if (!botIsHigher) {
      await this.sendBotRoleLow(message);
      return this.constructor.statuses.FAILURE;
    }
    if (roleAddable) {
      await message.member.roles.add(role.id);
      await this.sendJoined(message, role);
      return this.constructor.statuses.SUCCESS;
    }
    await this.sendCantJoin(message, userHasRole, userHasMinimumRole);
    return this.constructor.statuses.FAILURE;
  }

  // eslint-disable-next-line class-methods-use-this
  async sendJoined(message, role) {
    const embed = {
      title: 'Joined Role',
      description: role.name,
      type: 'rich',
      color: 0x779ECB,
    };
    await message.reply({ embeds: [embed] });
  }

  // eslint-disable-next-line class-methods-use-this
  async sendCantJoin(message, userHasRole, hasMinimumRole) {
    const embed = {
      title: 'Can\'t Join',
      description: determineDescription(userHasRole, hasMinimumRole),
      type: 'rich',
      color: 0x779ECB,
    };
    await message.reply({ embeds: [embed] });
  }

  // eslint-disable-next-line class-methods-use-this
  async sendBotRoleLow(message) {
    await message.reply({
      embeds: [{
        title: 'Can\'t Assign Role',
        description: 'Bot\'s role is too low.\nEnsure it is above role to be added.',
        type: 'rich',
        color: 0x779ECB,
      }],
    });
  }

  async sendInstructionEmbed(message) {
    const embed = {
      title: 'Usage',
      type: 'rich',
      color: 0x779ECB,
      fields: [
        {
          name: '\u200B',
          value: 'Role or role id to join.',
        },
        {
          name: 'Possible role values:',
          value: '\u200B',
        },
      ],
    };
    const prefix = await this.settings.getGuildSetting(message.guild, 'prefix');
    embed.fields[0].name = `${prefix}${this.call} <role or role id>`;
    const roles = await this.settings.getRolesForGuild(message.guild);
    embed.fields[1].value = roles.length ? roles.map(role => role.guildRole.name).join('; ') : 'No possible roles';
    if (!message.channel) return undefined;
    return message.reply({ embeds: [embed] });
  }
}

module.exports = JoinRole;
