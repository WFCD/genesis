'use strict';

const Command = require('../../models/Command.js');
const { captures } = require('../../CommonFunctions');

class SetTemplate extends Command {
  constructor(bot) {
    super(bot, 'dynamicchannels.template', 'templates set', 'Set Template Channel name template', 'UTIL');
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
   * @param {Discord.Message} message Message with a command to handle, reply to,
   *                          or perform an action based on parameters.
   * @param {Object}  ctx     Context object
   * @returns {string} success status
   */
  async run(message, ctx) {
    const templateChannelId = message.strippedContent.match(this.regex)[1];
    const nameTemplate = message.strippedContent.match(this.regex)[2];
    if (!templateChannelId || !nameTemplate) {
      return this.sendToggleUsage(message, ctx, []);
    }
    if (templateChannelId && this.bot.client.channels.cache.has(templateChannelId.trim())) {
      const template = this.bot.client.channels.cache.get(templateChannelId.trim());
      if (await ctx.settings.isTemplate(template)) {
        await ctx.settings.setDynTemplate(template.id, nameTemplate);
        await message.reply(ctx.i18n`\`${nameTemplate}\` set as ${template}'s name template.`);
        return this.constructor.statuses.SUCCESS;
      }
    }
    return this.constructor.statuses.FAILURE;
  }
}

module.exports = SetTemplate;
