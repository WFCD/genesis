'use strict';

const Command = require('../../models/Command.js');
const FissureEmbed = require('../../embeds/FissureEmbed.js');

/**
 * Displays the currently active Invasions
 */
class Fissures extends Command {
  /**
   * Constructs a callable command
   * @param {Genesis} bot  The bot object
   */
  constructor(bot) {
    super(bot, 'warframe.worldstate.fissures', 'fissure', 'Get the current list of Void Fissure Missions');
    this.regex = new RegExp(`^${this.call}s?(?:\\s+on\\s+([pcsxb14]{2,3}))?$`, 'i');
  }

  async run(message) {
    const platformParam = message.strippedContent.match(this.regex)[1];
    const platform = platformParam || await this.settings.getChannelSetting(message.channel, 'platform');
    const ws = await this.bot.worldStates[platform.toLowerCase()].getData();
    const fissures = ws.fissures.sort((a, b) => a.tierNum > b.tierNum);
    await this.messageManager.embed(
      message,
      new FissureEmbed(this.bot, fissures, platform), true, false,
    );
    return this.messageManager.statuses.SUCCESS;
  }
}

module.exports = Fissures;
