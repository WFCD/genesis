'use strict';

const Command = require('../../models/Command.js');
const ArbitrationEmbed = require('../../embeds/ArbitrationEmbed.js');
const { captures } = require('../../CommonFunctions');

/**
 * Displays the currently active alerts
 */
class Arbitration extends Command {
  /**
   * Constructs a callable command
   * @param {Genesis} bot  The bot object
   */
  constructor(bot) {
    super(bot, 'warframe.worldstate.arbitration', 'arbi', 'Display the currently active arbitration', 'WARFRAME');
    this.regex = new RegExp(`^${this.call}(?:tration)?(?:\\s+on\\s+${captures.platforms})?$`);
  }

  async run(message, ctx) {
    const platformParam = message.strippedContent.match(new RegExp(captures.platforms, 'ig'));
    const platform = platformParam && platformParam.length ? platformParam[0] : ctx.platform;
    const arbi = (await this.ws.get('arbitration', platform, ctx.language));

    if (!arbi) {
      await message.reply({ content: ctx.i18n`No Arbitration Mission Active` });
    }

    await message.reply({ embeds: [new ArbitrationEmbed(undefined, arbi, platform, ctx.i18n)] });

    return this.constructor.statuses.SUCCESS;
  }
}

module.exports = Arbitration;
