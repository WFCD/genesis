'use strict';

const Command = require('../../models/Command.js');

class DeleteCustomCommand extends Command {
  constructor(bot) {
    super(bot, 'customcommands.delete', 'delete cc', 'Delete a custom command', 'CUST_CMDS');
    this.usages = [
      { description: 'Delete a custom command', parameters: ['command call'] },
    ];
    this.regex = new RegExp(`^${this.call}\\s+(\\w+)?$`, 'i');
    this.requiresAuth = true;
    this.allowDM = false;
  }

  async run(message, ctx) {
    const params = message.strippedContent.match(this.regex);
    if (!params[1]) {
      this.messageManager.embed(message, {
        title: ctx.i18n`Delete Custom Command`,
        fields: [{ name: '\u200B', value: `**${this.call}**\n${ctx.i18n`**command call**: command trigger to delete`}` }],
      }, true, false);
      return this.messageManager.statuses.FAILURE;
    }
    await this.settings.deleteCustomCommand(message, params[1]);
    await this.commandManager.loadCustomCommands();
    await this.messageManager.notifySettingsChange(message, true, true);
    return this.messageManager.statuses.SUCCESS;
  }
}

module.exports = DeleteCustomCommand;
