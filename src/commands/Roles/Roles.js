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
         if (roles.length > 0) {
           const longest = roles.map(role => role.name)
            .reduce((a, b) => (a.length > b.length ? a : b));
           const groupedRoles = createGroupedArray(roles, 24);
           const metaGroups = createGroupedArray(groupedRoles, 4);
           metaGroups.forEach((metaGroup) => {
             this.messageManager.embed(message,
             new RolesEmbed(this.bot, groupedRoles, prefix, longest.length),
              true, true);
           });

           this.messageManager.embed(message,
            new RolesEmbed(this.bot, groupedRoles, prefix, longest.length),
              true, true);
         } else {
           this.messageManager.embed(message,
            new RolesEmbed(this.bot, [], prefix, 0),
              true, true);
         }
       })
       .catch(this.logger.error);
  }
}

module.exports = Roles;
