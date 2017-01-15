'use strict';

const Command = require('../Command.js');
const SyndicateEmbed = require('../embeds/SyndicateEmbed.js');


/**
 * Displays the currently active Invasions
 */
class Syndicates extends Command {
  /**
   * Constructs a callable command
   * @param {Genesis} bot  The bot object
   */
  constructor(bot) {
    super(bot, 'ondemand.syndicate', 'syndicate', 'Gets the starchat nodes for the desired syndicate, or all.');
    this.regex = new RegExp(`^${this.bot.escapedPrefix}syndicate(?:\\s+([\\w+\\s]+))?`, 'i');
    this.usages = [
      {
        description: 'Display syndicate nodes for a syndicate.',
        parameters: ['syndicate'],
      },
    ];
  }

  /**
   * Run the command
   * @param {Message} message Message with a command to handle, reply to,
   *                          or perform an action based on parameters.
   */
  run(message) {
    const syndicate = message.content.match(this.regex)[1];
    this.bot.settings.getChannelPlatform(message.channel)
      .then(platform => this.bot.worldStates[platform].getData())
      .then((ws) => {
        const syndicateMissions = ws.syndicateMissions;
        return message.channel.sendEmbed(new SyndicateEmbed(this.bot,
          syndicateMissions, syndicate));
      }).then(() => {
        if (message.deletable) {
          return message.delete(2000);
        }
        return Promise.resolve();
      })
      .catch(this.logger.error);
  }
}

module.exports = Syndicates;
