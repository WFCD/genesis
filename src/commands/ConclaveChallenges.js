'use strict';

const Command = require('../Command.js');

const values = ['all', 'day', 'week'];// ['all', 'arbiters', 'veil', 'suda', 'meridian', 'loka', 'perrin'];

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
        const categoryInValues = values.indexOf(category) !== -1;
        const color = categoryInValues ? 0x00ff00 : 0xff0000;
        const embed = {
          color,
          title: 'Worldstate - Conclave Challenges',
          url: 'https://warframe.com',
          description: `Current Challenges for category: ${typeof category === 'undefined' ? 'none' : category}`,
          thumbnail: {
            url: 'https://raw.githubusercontent.com/aliasfalse/genesis/master/src/resources/conclave.png',
          },
          fields: [],
          footer: {
            icon_url: 'https://avatars1.githubusercontent.com/u/24436369',
            text: 'Data evaluated by warframe-wordstate-parser, Warframe Community Developers',
          },
        };
        if (categoryInValues) {
          conclaveChallenges.forEach((challenge) => {
            if ((challenge.category === category || category === 'all') && !challenge.isRootChallenge()) {
              embed.fields.push({ name: challenge.mode, value: `${challenge.description} expires in ${challenge.getEndString()}` });
            }
          });
        } else {
          embed.fields.push({ name: 'No such conclave category', value: `Valid values: ${values.join(', ')}` });
        }

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
