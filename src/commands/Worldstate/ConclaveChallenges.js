'use strict';

const Command = require('../../Command.js');
const ConclaveChallengeEmbed = require('../../embeds/ConclaveChallengeEmbed.js');

const values = ['all', 'day', 'week'];


/**
 * Displays the currently active Invasions
 */
class ConclaveChallenges extends Command {
  /**
   * Constructs a callable command
   * @param {Genesis} bot  The bot object
   */
  constructor(bot) {
    super(bot, 'warframe.worldstate.conclaveChallenges', 'conclave', 'Gets the current conclave challenges for a category of challenge, or all.');
    this.regex = new RegExp(`^${this.call}(?:\\s+(${values.join('|')}))?(?:\\s+on\\s+([pcsxb14]{2,3}))?$`, 'i');

    this.usages = [
      {
        description: 'Display conclave challenges for a challenge type.',
        parameters: ['conclave category'],
      },
    ];
  }

  /**
   * Run the command
   * @param {Message} message Message with a command to handle, reply to,
   *                          or perform an action based on parameters.
   */
  run(message) {
    const matches = message.strippedContent.match(this.regex);
    const param1 = (matches[1] || '').toLowerCase();
    const param2 = (matches[2] || '').toLowerCase();
    const category = values.indexOf(param1) > -1 ? param1 : 'all';
    let platformParam;
    if (this.platforms.indexOf(param2) > -1) {
      platformParam = param2;
    } else if (this.platforms.indexOf(param1) > -1) {
      platformParam = param1;
    }
    this.bot.settings.getChannelPlatform(message.channel)
      .then(platform => this.bot.worldStates[platformParam || platform].getData()
          .then(ws => ({ ws, platform: platformParam || platform })))
      .then(({ ws, platform }) => {
        const conclaveChallenges = ws.conclaveChallenges;
        const embed = new ConclaveChallengeEmbed(this.bot, conclaveChallenges, category, platform);
        this.messageManager.embed(message, embed, true, false);
      })
      .catch(this.logger.error);
  }
}

module.exports = ConclaveChallenges;
