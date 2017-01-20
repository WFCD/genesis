'use strict';

const Command = require('../Command.js');
const ConclaveChallengeEmbed = require('../embeds/ConclaveChallengeEmbed.js');

/**
 * Displays the currently active Invasions
 */
class ConclaveChallenges extends Command {
  /**
   * Constructs a callable command
   * @param {Genesis} bot  The bot object
   */
  constructor(bot) {
    super(bot, 'ondemand.conclaveChallenges', 'conclave', 'Gets the current conclave challenges for a category of challenge, or all.');
    this.regex = new RegExp(`^${this.bot.escapedPrefix}conclave(?:\\s+([\\w+\\s]+))?`, 'i');

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
    const category = message.content.match(this.regex)[1];
    this.bot.settings.getChannelPlatform(message.channel)
      .then(platform => this.bot.worldStates[platform].getData())
      .then((ws) => {
        const conclaveChallenges = ws.conclaveChallenges;
        const embed = new ConclaveChallengeEmbed(this.bot, conclaveChallenges, category);
        return message.channel.sendEmbed(embed);
      }).then(() => {
        if (message.deletable) {
          return message.delete(2000);
        }
        return Promise.resolve();
      })
      .catch(this.logger.error);
  }
}

module.exports = ConclaveChallenges;
