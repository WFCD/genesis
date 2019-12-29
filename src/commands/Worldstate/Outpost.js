'use strict';

const Command = require('../../models/Command');
const { captures } = require('../../CommonFunctions');
const SentientOutpostEmbed = require('../../embeds/SentientOutpostEmbed');

class Outpost extends Command {
  constructor(bot) {
    super(bot, 'warframe.worldstate.rjoutpost', 'outpost', 'Display the activity status of the Sentient Outpost');
    this.regex = new RegExp(`^${this.call}\\s?(?:on\\s+${captures.platforms})?`, 'i');
  }

  async run(message, ctx) {
    const platformParam = message.strippedContent.match(new RegExp(captures.platforms, 'ig'));
    const platform = platformParam && platformParam.length ? platformParam[0] : ctx.platform;
    const outpost = await this.ws.get('sentientOutposts', platform, ctx.language);
    if (outpost.active) {
      const embed = new SentientOutpostEmbed(this.bot, outpost, platform, ctx.i18n);
      this.messageManager.send(message.channel, embed);
    } else {
      this.messageManager.send(message.channel, ctx.i18n` :warning: No active outpost detected`);
    }
    return this.messageManager.statuses.SUCCESS;
  }
}

module.exports = Outpost;
