'use strict';

const Command = require('../../models/Command.js');
const { captures } = require('../../CommonFunctions');

class SetTemplate extends Command {
  constructor(bot) {
    super(bot, 'dynamicchannels.template', 'templates set', 'Set Template Channel name template');
    this.regex = new RegExp(`^${this.call}\\s?${captures.channel}?(?:\\s+(.*))?$`, 'i');
    this.requiresAuth = true;
    this.allowDM = false;
    this.usages = [
      {
        description: 'Set a channel template\'s name template. `$username` is available as a replacement for using the name of the user that generated the channel.',
        parameters: ['channel mention', 'name template'],
      },
    ];
  }

  /**
   * Run the command
   * @param {Message} message Message with a command to handle, reply to,
   *                          or perform an action based on parameters.
   * @returns {string} success status
   */
  async run(message) {
    const templateChannelId = message.strippedContent.match(this.regex)[1];
    const nameTemplate = message.strippedContent.match(this.regex)[2];
    if (!templateChannelId || !nameTemplate) {
      return this.sendToggleUsage(message, ctx, []);
    }
    if (templateChannelId && this.bot.client.channels.has(templateChannelId.trim())) {
      const template = this.bot.client.channels.get(templateChannelId.trim());
      if (await this.settings.isTemplate(template)) {
        await this.settings.setDynTemplate(template.id, nameTemplate);
        this.messageManager.reply(message, `\`${nameTemplate}\` set as ${template}'s name template'.`, true, true);
        return this.messageManager.statuses.SUCCESS;
      }
    }
    return this.messageManager.statuses.FAILURE;
  }
}

module.exports = SetTemplate;
