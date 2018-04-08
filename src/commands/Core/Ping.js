'use strict';

const ping = require('ping').promise;
const Command = require('../../models/Command.js');
const { timeDeltaToString } = require('../../CommonFunctions.js');

/**
 * Displays the response time for the bot and checks Warframe's servers to see if they are up
 */
class Ping extends Command {
  /**
   * Constructs a callable command
   * @param {Genesis} bot The bot object
   */
  constructor(bot) {
    super(bot, 'core.ping', 'ping', 'Ping Genesis to test connectivity');
  }

  /**
   * Run the command
   * @param {Message} message Message with a command to handle, reply to,
   *                          or perform an action based on parameters.
   * @returns {string} success status
   */
  async run(message) {
    const hosts = ['content.warframe.com', 'forums.warframe.com', 'trials.wf', 'store.warframe.com', 'nexus-stats.com', 'warframe.market'];
    const results = [];

    hosts.forEach((host) => {
      ping.probe(host)
        .then((result) => {
          results.push({
            name: host,
            value: `${result.alive ? '<:check:314349398811475968>' : '<:empty:314349398723264512>'} ` +
              `${typeof result.time !== 'undefined' ? result.time : '<:xmark:314349398824058880>'}ms`,
          });
        });
    });

    const now = Date.now();
    message.reply('Testing Ping')
      .then((msg) => {
        const afterSend = Date.now();
        return msg.edit({
          embed: {
            title: 'PONG',
            type: 'rich',
            fields: [
              {
                name: `Response time (shard ${this.bot.shardId + 1} of ${this.bot.shardCount})`,
                value: `${afterSend - now}ms`,
              },
              ...results,
            ],
            footer: {
              thumbnail_url: '_ _',
              text: `Uptime: ${timeDeltaToString(this.bot.client.uptime)}`,
            },
          },
        });
      })
      .then((editedMessage) => {
        editedMessage.delete(100000);
        if (message.deletable) {
          message.delete(10000);
        }
      })
      .catch(this.logger.error);
    return this.messageManager.statuses.SUCCESS;
  }
}

module.exports = Ping;
