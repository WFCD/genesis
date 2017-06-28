'use strict';

const Command = require('../../Command.js');
const ProfileEmbed = require('../../embeds/ProfileEmbed.js');

const inProgressEmbed = { title: 'Processing search... 0s Remaining...' };

/**
 * Looks up items from Nexus-stats.com
 */
class PriceCheck extends Command {
  /**
   * Constructs a callable command
   * @param {Genesis} bot  The bot object
   */
  constructor(bot) {
    super(bot, 'warframe.misc.profile', 'profile', 'profile');
    this.regex = new RegExp(`^${this.call}(?:\\s+(\\w+))?`, 'i');

    this.usages = [
      {
        description: 'Search for a player\'s profile',
        parameters: ['in-game name (PC only)'],
      },
    ];
  }

  /**
   * Run the command
   * @param {Message} message Message with a command to handle, reply to,
   *                          or perform an action based on parameters.
   */
  run(message) {
    const username = message.strippedContent.match(this.regex)[1];
    if (typeof username === 'undefined') {
      this.sendUsageEmbed(message);
      return;
    }
    message.channel.send('', { embed: inProgressEmbed })
      .then(sentMessage => ({
        profile:
        {
          name: 'tobiah',
          accolades: {
            founder: 'Grand Master',
            guide: 'Senior Guide of the Lotus',
            moderator: false,
            partner: false,
            staff: false,
          },
          mastery: {
            rank: {
              name: 'Gold Dragon',
              number: 24,
              next: 'Sage',
            },
            xp: 1440334,
            xpUntilNextRank: 122166,
          },
          clan: {
            name: 'Morningstar',
            rank: 9,
            type: 'Shadow Clan',
          },
          marked: {
            stalker: true,
            g3: false,
            zanuka: false,
          },
          updatedAt: '2017-06-28T06:31:30.270Z',
        },
        sentMessage,
      }))
      .then(({ profile, sentMessage }) => sentMessage.edit('', { embed: new ProfileEmbed(this.bot, profile) }))
      .catch(this.logger.error);
  }

  sendUsageEmbed(message) {
    this.bot.settings.getChannelPrefix(message.channel)
      .then((prefix) => {
        const embed = {
          type: 'rich',
          color: 0x0000ff,
          fields: [
            {
              name: `${prefix}${this.call} <ign>`,
              value: 'Search for Player Profile',
              inline: true,
            },
            {
              name: 'Parameters:',
              value: '`player in-game name` : In-game name of user whose profile you wish to fetch',
              inline: false,
            },
          ],
        };
        this.messageManager.embed(message, embed, true, true);
      })
      .catch(this.logger.error);
  }
}

module.exports = PriceCheck;
