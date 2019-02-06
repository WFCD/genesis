'use strict';

const Command = require('../../models/Command.js');
const VoidTraderEmbed = require('../../embeds/VoidTraderEmbed.js');
const { captures, createGroupedArray, createPageCollector } = require('../../CommonFunctions');

/**
 * Displays the currently active Invasions
 */
class Baro extends Command {
  /**
   * Constructs a callable command
   * @param {Genesis} bot  The bot object
   */
  constructor(bot) {
    super(bot, 'warframe.worldstate.baro', 'baro', 'Display the current status of the Void Trader');
    this.regex = new RegExp(`^${this.call}(?:\\s+on\\s+${captures.platforms})?`, 'i');
  }

  async run(message, ctx) {
    const platformParam = message.strippedContent.match(this.regex)[1];
    const platform = platformParam || ctx.platform;
    const ws = await this.bot.worldStates[platform.toLowerCase()].getData();
    const pages = [];
    const embed = new VoidTraderEmbed(this.bot, ws.voidTrader, platform);
    if (embed.fields.length > 25) {
      createGroupedArray(embed.fields, 15).forEach((fieldGroup) => {
        this.logger.debug(fieldGroup);
        const tembed = Object.assign({}, embed);
        tembed.fields = fieldGroup;
        pages.push(tembed);
      });
    } else {
      pages.push(embed);
    }
    if (pages.length) {
      const msg = await this.messageManager.embed(message, pages[0], false, false);
      await createPageCollector(msg, pages, message.author);
    }
    if (parseInt(await this.settings.getChannelSetting(message.channel, 'delete_after_respond'), 10) && message.deletable) {
      message.delete({ timeout: 10000 });
    }
    return this.messageManager.statuses.SUCCESS;
  }
}

module.exports = Baro;
