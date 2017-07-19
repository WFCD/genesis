'use strict';

const Command = require('../../Command.js');
const rpad = require('right-pad');

function createGroupedArray(arr, chunkSize) {
  const groups = [];
  for (let i = 0; i < arr.length; i += (chunkSize || 10)) {
    groups.push(arr.slice(i, i + (chunkSize || 10)));
  }
  return groups;
}

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
   */
  run(message) {
    const longest = message.guild.roles.map(role => role.name)
     .reduce((a, b) => (a.length > b.length ? a : b));
    const roleGroups = createGroupedArray(message.guild.roles.map(role => `\`${rpad(role.name, longest.length, ' ')} ${role.id}\``), 20);
    this.messageManager.embed(message,
      {
        fields: roleGroups.map(roleGroup => ({
          name: '_ _',
          value: roleGroup.join('\n'),
        })),
      }, true, false);
  }
}

module.exports = Roles;
