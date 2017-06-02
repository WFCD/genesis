'use strict';

const Command = require('../../Command.js');
const rpad = require('right-pad');

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
       .then((roles) => {
         this.messageManager.embed(message, {
           title: 'Joinable Roles',
           type: 'rich',
           color: 0x779ECB,
           fields: [
             {
               name: '_ _',
               value: roles.length ? `${roles.map(role => `\`${rpad(role.name, 17, ' ')}${rpad(String(role.members.size), 4, ' ')} members\``).join(' \n')}` : 'No joinable Roles',
             },
             {
               name: '_ _',
               value: '**Use the `/join` command to join a role**',
             },
           ],
         }, true, true);
       })
       .catch(this.logger.error);
  }
}

module.exports = Roles;
