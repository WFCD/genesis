'use strict';

const Command = require('../../models/Command');
const { captures, setupPages } = require('../../CommonFunctions');
const BaseEmbed = require('../../embeds/BaseEmbed');

class Outpost extends Command {
  constructor(bot) {
    super(bot, 'warframe.worldstate.rjoutpost', 'outpost', 'Display the activity status of the Sentient Outpost');
    this.regex = new RegExp(`^${this.call}\\s?(?:on\\s+${captures.platforms})?`, 'i');
  }
  
  async run(message, ctx) {
    const platformParam = message.strippedContent.match(new RegExp(captures.platforms, 'ig'));
    const platform = platformParam && platformParam.length ? platformParam[0] : ctx.platform;
    const outpost = await this.ws.get('sentientOutposts', platform, ctx.language);
    const embed = new BaseEmbed();
    embed.setTitle(ctx.i18n`[${platform.toUpperCase()}] Sentient Outpost`);
    if (outpost.active) {
      embed.setDescription(outpost.mission.node);
    } else {
      embed.setDescription(ctx.i18n`:warning: No active outpost detected`);
    }
    this.messageManager.send(message.channel, embed);
  }
}

module.exports = Outpost;