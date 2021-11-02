'use strict';

const Command = require('../../models/Command.js');
const KuvaEmbed = require('../../embeds/KuvaEmbed.js');
const { captures } = require('../../CommonFunctions');

/**
 * Displays the currently active kuva missions
 */
class Kuva extends Command {
  /**
   * Constructs a callable command
   * @param {Genesis} bot  The bot object
   */
  constructor(bot) {
    super(bot, 'warframe.worldstate.kuva', 'kuva', 'Display the currently active kuva missions', 'WARFRAME');
  }

  async run(message, ctx) {
    const platformParam = message.strippedContent.match(new RegExp(captures.platforms, 'ig'));
    const platform = platformParam && platformParam.length ? platformParam[0] : ctx.platform;
    const kuva = (await this.ws.get('kuva', platform, ctx.language));

    if (!kuva.length) {
      await message.reply({ content: ctx.i18n`No Kuva Missions Active` });
      return this.messageManager.statuses.SUCCESS;
    }

    const embed = new KuvaEmbed(this.bot, kuva, platform, ctx.i18n);
    await message.reply({ embeds: [embed] });

    return this.messageManager.statuses.SUCCESS;
  }
}

module.exports = Kuva;
