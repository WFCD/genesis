'use strict';

const Command = require('../../models/Command.js');
const LFGEmbed = require('../../embeds/LFGEmbed');

/**
 * Create temporary voice/text channels (can be expanded in the future)
 */
class AddLFG extends Command {
  /**
   * Constructs a callable command
   * @param {Genesis} bot  The bot object
   */
  constructor(bot) {
    super(bot, 'lfg.add', 'lfg', 'Submit an LFG request.');
    this.regex = new RegExp(`^${this.call}\\s?(.+)?`, 'i');

    this.usages = [
      { description: 'Submit an LFG request to this guild\'s LFG channel', parameters: ['place', 'time', 'for', 'platform *'], separator: ' | ' },
    ];

    this.allowDM = false;
  }

  async run(message, ctx) {
    if (ctx.lfgChannel) {
      const matches = message.strippedContent.match(this.regex)[1];
      const params = (matches || '').split('|');
      if (params.length < 1) {
        // let them know there's not enough params
        await this.messageManager.reply(message, `please review the output of \`${ctx.prefix}help lfg\``);
        return this.messageManager.statuses.FAILURE;
      }
      const lfg = {
        author: message.author,
        location: params[0] || 'Anywhere',
        duration: params[1] || 'Any Time',
        goal: params[2] || 'Anything',
        platform: params[3] || ctx.platform.toUpperCase(),
      };

      // save params based on order
      const embed = new LFGEmbed(this.bot, lfg);
      await this.messageManager.embedToChannel(ctx.lfgChannel, embed);
      return this.messageManager.statuses.SUCCESS;
    }
    await this.messageManager.reply(message, `please ask your admin to designate a setting for  \`${ctx.prefix}set lfg channel\``);
    return this.messageManager.statuses.FAILURE;
  }
}

module.exports = AddLFG;
