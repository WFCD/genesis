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
   */
  run(message) {
    this.bot.settings.getRolesForGuild(message.guild)
       .then(roles => this.bot.settings.getChannelPrefix(message.channel)
         .then(prefix => ({ roles, prefix })))
       .then(({ roles, prefix }) => {
         const longest = roles.map(role => role.name)
          .reduce((a, b) => (a.length > b.length ? a : b));
         const groupedRoles = createGroupedArray(roles, 24);
         groupedRoles.forEach((roleGroup) => {
           this.messageManager.embed(message,
            new RolesEmbed(this.bot, roleGroup, prefix, longest.length),
              true, true);
         });
       })
       .catch(this.logger.error);
  }
}

module.exports = Roles;
