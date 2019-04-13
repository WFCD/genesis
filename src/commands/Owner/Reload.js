'use strict';

const Command = require('../../models/Command.js');

/**
 * Reloads the script containing the commands
 */
class Reload extends Command {
  /**
   * Constructs a callable command
   * @param {Genesis} bot The bot object
   */
  constructor(bot) {
    super(bot, 'core.reload', 'reload', 'Reload bot modules');
    this.ownerOnly = true;
  }

  /**
   * Run the command
   * @param {Message} message Message with a command to handle, reply to,
   *                          or perform an action based on parameters.
   * @returns {string} success status
   */
  async run(message) {
    this.logger.debug('Reloading modules');
    const commandsBefore = this.commandManager.commands.map(c => c.id);
    const precache = Object.keys(this.commandManager.commandCache);
    delete this.commandManager.commandCache;
    this.commandManager.commandCache = {};
    this.commandManager.loadCommands();
    const commandsAfter = this.commandManager.commands.map(c => c.id);

    const commandsAdded = commandsAfter.filter(command => !commandsBefore.includes(command));
    const commandsRemoved = commandsBefore.filter(command => !commandsAfter.includes(command));

    const commandsAddedString = commandsAdded.length > 0 ? commandsAdded.sort().join(' ') : ' No Commands Added';
    const commandsRemovedString = commandsRemoved.length > 0 ? commandsRemoved.sort().join(' ') : ' No Commands Removed';
    const precacheString = precache.length > 0 ? precache.sort().join('\n- ') : 'No Commands decached'

    await this.messageManager.sendMessage(message, `**Commands reloaded!**
\`\`\`diff
- ${commandsRemovedString}\`\`\`
\`\`\`diff
+ ${commandsAddedString}\`\`\`

**Decached**
\`\`\`diff
- ${precacheString}
\`\`\``, true, true);
    return this.messageManager.statuses.SUCCESS;
  }
}

module.exports = Reload;
