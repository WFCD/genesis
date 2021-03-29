'use strict';

const Command = require('../../models/Command.js');

const allowedParams = ['call', 'response'];

class UpdateCustomCommand extends Command {
  constructor(bot) {
    super(bot, 'customcommands.update', 'update cc', 'Update a custom command', 'CUST_CMDS');
    this.usages = [
      { description: 'Update a custom command', parameters: ['param', 'command call', 'new param value'] },
    ];
    this.regex = new RegExp(`^${this.call}\\s+(?:(call|response)\\s(\\w+)\\s(.*))?$`, 'i');
    this.requiresAuth = true;
    this.allowDM = false;
  }

  async run(message, ctx) {
    const params = message.strippedContent.match(this.regex);
    if (params[1].length < 4 || !allowedParams.includes(params[1].toLowerCase())) {
      this.messageManager.embed(message, {
        title: 'Update Custom Command',
        fields: [{
          name: '\u200B', value: `**${this.call}**
        \n${ctx.i18n`**param**: 'call' or 'response', part of the custom command to edit`}
        \n${ctx.i18n`**command call**: command trigger to edit`}
        \n${ctx.i18n`**new param value**: new value for param`}`,
        }],
      }, true, false);
      return this.messageManager.statuses.FAILURE;
    }

    const [, param, call, newVal] = params;

    const cc = await this.settings.getCustomCommandRaw(message.guild, call);

    this.logger.warn(JSON.stringify(cc));

    if (!cc) {
      this.messageManager.reply(message, ctx.i18n`Command \`${call}\` is an invalid command`);
      return this.messageManager.statuses.FAILURE;
    }

    cc[param.toLowerCase()] = newVal;
    await this.settings.updateCustomCommand(message.guild, cc);
    await this.commandManager.loadCustomCommands();
    await this.messageManager.notifySettingsChange(message, true, true);
    return this.messageManager.statuses.SUCCESS;
  }
}

module.exports = UpdateCustomCommand;
