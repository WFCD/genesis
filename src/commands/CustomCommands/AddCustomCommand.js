'use strict';

const Command = require('../../models/Command.js');

class AddCustomCommand extends Command {
  constructor(bot) {
    super(bot, 'customcommands.add', 'add cc', 'Add a custom command', 'CUST_CMDS');
    this.usages = [
      { description: 'Add a custom command', parameters: ['command call', 'command response'] },
    ];
    this.regex = new RegExp(`^${this.call}\\s+(\\w+)?\\s?([\\s\\S]*)`, 'i');
    this.requiresAuth = true;
    this.allowDM = false;
  }

  async run(message, ctx) {
    const params = message.strippedContent.match(this.regex);
    if (!params[1] || !params[2]) {
      this.messageManager.embed(message, {
        title: ctx.i18n`Adding Custom Commands`,
        fields: [{
          name: '\u200B',
          value: `**${this.call}**\n`
            + `${ctx.i18n`**command call**: command trigger`}\n`
            + `${ctx.i18n`**command response**: response to the trigger`}`,
        }],
      }, true, false);
      return this.messageManager.statuses.FAILURE;
    }
    await this.settings.addCustomCommand(message, params[1], encodeURIComponent(params[2]));
    await this.commandManager.loadCustomCommands();
    await this.messageManager.notifySettingsChange(message, true, true);
    return this.messageManager.statuses.SUCCESS;
  }
}

module.exports = AddCustomCommand;
