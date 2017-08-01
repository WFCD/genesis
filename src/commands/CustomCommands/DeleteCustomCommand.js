'use strict';

const Command = require('../../Command.js');

class DeleteCustomCommand extends Command {
  constructor(bot) {
    super(bot, 'customcommands.delete', 'delete cc');
    this.usages = [
      { description: 'Delete a custom command', parameters: ['command call'] },
    ];
    this.regex = new RegExp(`^${this.call}\\s+(\\w+)?$`, 'i');
    this.requiresAuth = true;
    this.allowDM = false;
  }

  run(message) {
    const params = message.strippedContent.match(this.regex);
    if (!params[1]) {
      this.messageManager.embed(message, {
        title: 'Delete Custom Command',
        fields: [{ name: '_ _', value: `**${this.call}**\n**command call**: command trigger to delete` }],
      }, true, false);
    } else {
      this.bot.settings.deleteCustomCommand(message, params[1])
        .then(() => {
          this.commandHandler.loadCustomCommands();
          this.messageManager.notifySettingsChange(message, true, true);
        });
    }
  }
}

module.exports = DeleteCustomCommand;
