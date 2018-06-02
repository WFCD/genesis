'use strict';

const Command = require('../../models/Command.js');
const rpad = require('right-pad');
const { createGroupedArray, createPageCollector } = require('../../CommonFunctions.js');

/**
 * Add a joinable role
 */
class Roles extends Command {
  constructor(bot) {
    super(bot, 'settings.roleids', 'roleids', 'Get list of role ids');
    this.allowDM = false;
    this.requiresAuth = true;
  }

  /**
   * Run the command
   * @param {Message} message Message with a command to handle, reply to,
   *                          or perform an action based on parameters.
   * @returns {string} success status
   */
  async run(message) {
    const roles = message.guild.roles.array().sort((a, b) => {
      if (a.name < b.name) {
        return -1;
      } else if (a.name > b.name) {
        return 1;
      }
      return 0;
    });
    const longest = roles.map(role => role.name)
      .reduce((a, b) => (a.length > b.length ? a : b));
    const roleGroups = createGroupedArray(roles.map(role => `\`${rpad(role.name, longest.length, ' ')} ${role.id}\``), 6);
    const metaGroups = createGroupedArray(roleGroups, 4);
    const embeds = [];
    metaGroups.forEach((metaGroup) => {
      embeds.push({
        title: 'Role Ids',
        color: 0xFFD700,
        fields: metaGroup.map(roleGroup => ({
          name: '_ _',
          value: roleGroup.join('\n'),
        })),
      });
    });
    const msg = await this.messageManager.embed(message, embeds[0], true, false);
    await createPageCollector(msg, embeds, message.author);
    return this.messageManager.statuses.SUCCESS;
  }
}

module.exports = Roles;
