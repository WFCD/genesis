'use strict';

const ping = require('ping').promise;
const Command = require('../../Command.js');

/**
 * @param   {number} millis The number of milliseconds in the time delta
 * @returns {string}
 */
function timeDeltaToString(millis) {
  if (typeof millis !== 'number') {
    throw new TypeError('millis should be a number');
  }
  const timePieces = [];
  const prefix = millis < 0 ? '-' : '';
  let seconds = Math.abs(millis / 1000);

  // Seconds in a day
  if (seconds >= 86400) {
    timePieces.push(`${Math.floor(seconds / 86400)}d`);
    seconds = Math.floor(seconds) % 86400;
  }
  // Seconds in an hour
  if (seconds >= 3600) {
    timePieces.push(`${Math.floor(seconds / 3600)}h`);
    seconds = Math.floor(seconds) % 3600;
  }
  if (seconds >= 60) {
    timePieces.push(`${Math.floor(seconds / 60)}m`);
    seconds = Math.floor(seconds) % 60;
  }
  if (seconds >= 0) {
    timePieces.push(`${Math.floor(seconds)}s`);
  }
  return `${prefix}${timePieces.join(' ')}`;
}

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
   */
  run(message) {
    const hosts = ['content.warframe.com', 'forums.warframe.com', 'wf.christx.tw', 'store.warframe.com'];
    const results = [];

    hosts.forEach((host) => {
      ping.probe(host)
        .then((result) => {
          results.push({
            name: host,
            value: `${result.alive ? '\u2705' : ':x:'} ` +
              `${typeof result.time !== 'undefined' ? result.time : '\u221E'}ms`,
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
              { name: `Response time (shard ${this.bot.shardId + 1} of ${this.bot.shardCount})`,
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
  }
}

module.exports = Ping;
