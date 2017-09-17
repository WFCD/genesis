'use strict';

const Command = require('../../Command.js');
const RolesEmbed = require('../../embeds/RolesEmbed.js');

function createGroupedArray(arr, chunkSize) {
  const groups = [];
  for (let i = 0; i < arr.length; i += chunkSize) {
    groups.push(arr.slice(i, i + chunkSize));
  }
  return groups;
}

/**
 * Add a joinable role
 */
class Roles extends Command {
  constructor(bot) {
    super(bot, 'settings.ranks', 'roles', 'Get list of joinable roles');
    this.allowDM = false;
  }

  /**
   * Run the command
   * @param {Message} message Message with a command to handle, reply to,
   *                          or perform an action based on parameters.
   * @returns {string} success status
   */
  async run(message) {
    const roles = await this.bot.settings.getRolesForGuild(message.guild);
    const prefix = await this.bot.settings.getChannelSetting(message.channel, 'prefix');
    if (roles.length > 0) {
      const longest = roles.map(role => role.name)
        .reduce((a, b) => (a.length > b.length ? a : b));
      const groupedRoles = createGroupedArray(roles, 20);
      const metaGroups = createGroupedArray(groupedRoles, 4);
      metaGroups.forEach((metaGroup) => {
        this.messageManager.embed(message,
          new RolesEmbed(this.bot, metaGroup, prefix, longest.length),
          true, true);
      });
      return this.messageManager.statuses.SUCCESS;
    }
    await this.messageManager.embed(message,
        new RolesEmbed(this.bot, [], prefix, 0),
        true, true);
    return this.messageManager.statuses.FAILURE;
  }
}

module.exports = Roles;
