'use strict';

const Command = require('../../models/Command.js');
const RolesEmbed = require('../../embeds/RolesEmbed.js');
const { createGroupedArray, setupPages } = require('../../CommonFunctions');

/**
 * Add a joinable role
 */
class Roles extends Command {
  constructor(bot) {
    super(bot, 'settings.ranks', 'roles', 'Get list of joinable roles', 'UTIL');
    this.allowDM = false;
  }

  async run(message) {
    const roles = (await this.settings.getRolesForGuild(message.guild))
      .filter(role => (role && role.requiredRoleId
        ? message.member.roles.cache.has(role.requiredRoleId)
        : true));
    const prefix = await this.settings.getGuildSetting(message.guild, 'prefix');
    if (roles.length > 0) {
      const longest = roles.map(role => role.guildRole.name)
        .reduce((a, b) => (a.length > b.length ? a : b));
      const groupedRoles = createGroupedArray(roles, 10);
      const metaGroups = createGroupedArray(groupedRoles, 4);
      const embeds = [];
      metaGroups.forEach((metaGroup) => {
        embeds.push(new RolesEmbed(this.bot, metaGroup, prefix, longest.length));
      });
      await setupPages(embeds, { message, settings: this.settings, mm: this.messageManager });
      return this.constructor.statuses.SUCCESS;
    }
    const embed = new RolesEmbed(this.bot, [], prefix, 0);
    await message.reply({ embeds: [embed] });
    return this.constructor.statuses.FAILURE;
  }
}

module.exports = Roles;
