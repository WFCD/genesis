'use strict';

const https = require('https');
const Promise = require('bluebird');

const Command = require('../../Command.js');
const ProfileEmbed = require('../../embeds/ProfileEmbed.js');

const inProgressEmbed = { title: 'Processing search...' };
const profileUrl = 'https://api.nexus-stats.com/warframe/v1/players/$1/profile';
const statusUrl = 'https://api.nexus-stats.com/warframe/v1/bots/status';
const retryCodes = [429].concat((process.env.JSON_CACHE_RETRY_CODES || '')
  .split(',').map(code => parseInt(code.trim(), 10)));


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
      .then(sentMessage => this.httpGet(statusUrl)
          .then((status) => {
            const embedWithTime = { title: `Processing search... ${status['Player-Sentry'].queue.timeRemaining}...` };
            return sentMessage.edit('', { embed: embedWithTime });
          }))
      .then(sentMessage => this.httpGet(profileUrl.replace('$1', encodeURI(username)))
          .then(profile => ({ sentMessage, profile })))
      .then(({ sentMessage, profile }) => sentMessage.edit('', { embed: new ProfileEmbed(this.bot, profile) }))
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

  httpGet(url) {
    return new Promise((resolve) => {
      const request = https.get(url, (response) => {
        const body = [];
        if (response.statusCode < 200 || response.statusCode > 299) {
          if ((response.statusCode > 499 || retryCodes.indexOf(response.statusCode) > -1)
            && this.retryCount < 30) {
            this.retryCount += 1;
            setTimeout(() => this.httpGet().then(resolve), 1000);
          } else {
            this.logger.error(new Error(`Failed to load page, status code: ${response.statusCode}`));
            resolve({});
          }
        } else {
          response.on('data', chunk => body.push(chunk));
          response.on('end', () => {
            this.retryCount = 0;
            resolve(JSON.parse(body.join('')));
          });
        }
      });
      request.on('error', (err) => {
        this.logger.error(`Error code: ${err.statusCode} on request on ${this.url}`);
        resolve({});
      });
    });
  }
}

module.exports = PriceCheck;
