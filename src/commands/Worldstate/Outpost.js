'use strict';

const Command = require('../../models/Command');
const { captures, timeDeltaToMinutesString, fromNow } = require('../../CommonFunctions');
const SentientOutpostEmbed = require('../../embeds/SentientOutpostEmbed');

const next = (outpost) => {
  const defStart = new Date(outpost.activation).getTime();
  const defEnd = new Date(outpost.expiry).getTime();
  const predStart = new Date(outpost.previous.activation).getTime();
  const predEnd = new Date(outpost.previous.expiry).getTime();
  if (defStart > predStart) {
    return {
      activation: new Date(defStart),
      expiry: new Date(defEnd),
    };
  } else {
    return {
      activation: new Date(predStart),
      expiry: new Date(predEnd),
    };
  }
}

class Outpost extends Command {
  constructor(bot) {
    super(bot, 'warframe.worldstate.rjoutpost', 'outpost', 'Display the activity status of the Sentient Outpost', 'WARFRAME');
    this.regex = new RegExp(`^(?:${this.call}|anomaly)\\s?(?:on\\s+${captures.platforms})?`, 'i');
  }

  async run(message, ctx) {
    const platformParam = message.strippedContent.match(new RegExp(captures.platforms, 'ig'));
    const platform = platformParam && platformParam.length ? platformParam[0] : ctx.platform;
    const outpost = await this.ws.get('sentientOutposts', platform, ctx.language);
    if (outpost.active) {
      const embed = new SentientOutpostEmbed(this.bot, outpost, platform, ctx.i18n);
      this.messageManager.send(message.channel, embed);
    } else {
      this.messageManager.send(message.channel, ctx.i18n` :warning: No active outpost detected. Predicted arrival in **${timeDeltaToMinutesString(fromNow(next(outpost).activation))}**.`);
    }
    return this.messageManager.statuses.SUCCESS;
  }
}

module.exports = Outpost;
