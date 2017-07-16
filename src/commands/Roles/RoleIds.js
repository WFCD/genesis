'use strict';

const Command = require('../../Command.js');

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
    this.messageManager.embed(message,
      { fields: [{ name: '_ _', value: `\`\`\`["${message.guild.roles.map(role => role.id).join('","')}"]\`\`\`` }] },
      true, true);
  }
}

module.exports = Roles;
