'use strict';

const Command = require('../../Command.js');
const ProfileEmbed = require('../../embeds/ProfileEmbed.js');
const Nexus = require('nexus-stats-api');

const inProgressEmbed = { title: 'Processing search...', color: 0xF1C40F };

const nexusKey = process.env.NEXUSSTATS_USER_KEY || undefined;
const nexusSecret = process.env.NEXUSSTATS_USER_SECRET || undefined;

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
    this.regex = new RegExp(`^${this.call}(?:\\s+(.+))?`, 'i');
    this.usages = [
      {
        description: 'Search for a player\'s profile',
        parameters: ['in-game name (PC only)'],
      },
    ];

    const nexusOptions = {
      user_key: nexusKey,
      user_secret: nexusSecret,
      ignore_limiter: true,
    };
    this.nexusFetcher = new Nexus(nexusKey && nexusSecret ? nexusOptions : {});
  }

  /**
   * Run the command
   * @param {Message} message Message with a command to handle, reply to,
   *                          or perform an action based on parameters.
   */
  run(message) {
    const username = message.strippedContent.match(this.regex)[1].trim();
    if (typeof username === 'undefined') {
      this.sendUsageEmbed(message);
      return;
    }

    message.channel.send('', { embed: inProgressEmbed })
      .then(sentMessage => this.nexusFetcher.get('/warframe/v1/bots/status')
          .then((status) => {
            let embedWithTime = {};
            if (!status['Player-Sentry'].online) {
              embedWithTime = { title: 'Profile Engine Offline. New Entries will not be processed.', color: 0xaa0000 };
            } else {
              embedWithTime = { title: `Profile Engine Online... ${status['Player-Sentry'].queue.timeRemaining} remaining...` };
            }
            return sentMessage.edit('', { embed: embedWithTime });
          }))
      .then(sentMessage => this.nexusFetcher.get(`/warframe/v1/players/${username}/profile`)
          .then(profile => ({ sentMessage, profile })))
      .then(({ sentMessage, profile }) => {
        if (profile.name || profile.error === `${username} could not be found.`) {
          return sentMessage.edit('', { embed: new ProfileEmbed(this.bot, profile.name ? profile : {}) });
        }
        return null;
      })
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
