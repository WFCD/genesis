'use strict';

const Command = require('../../models/Command.js');
const InvasionEmbed = require('../../embeds/InvasionEmbed.js');

/**
 * Displays the currently active Invasions
 */
class Invasions extends Command {
  /**
   * Constructs a callable command
   * @param {Genesis} bot  The bot object
   */
  constructor(bot) {
    super(bot, 'warframe.worldstate.invasions', 'invasion', 'Display the currently active Invasions');
    this.regex = new RegExp(`^${this.call}s?(?:\\s+on\\s+([pcsxb14]{2,3}))?$`, 'i');
  }

  async run(message) {
    const platformParam = message.strippedContent.match(this.regex)[1];
    const platform = platformParam || await this.settings.getChannelSetting(message.channel, 'platform');
    const ws = await this.bot.worldStates[platform.toLowerCase()].getData();
    const invasions = ws.invasions.filter(i => !i.completed);
    await this.messageManager.embed(
      message,
      new InvasionEmbed(this.bot, invasions, platform), true, false,
    );
    return this.messageManager.statuses.SUCCESS;
  }
}

module.exports = Invasions;
