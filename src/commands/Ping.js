'use strict';

const ping = require('ping').promise;

const Command = require('../Command.js');

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
          results.push(`${result.alive ? ':white_check_mark:' : ':x:'} ${result.host}, pinged in ` +
            `${typeof result.time !== 'undefined' ? result.time : '\u221E'}ms`);
        });
    });

    const now = Date.now();
    message.reply('Testing Ping')
      .then((msg) => {
        const afterSend = Date.now();
        return msg.edit(`PONG in \`${afterSend - now}ms\`${this.md.lineEnd}${results.join(this.md.lineEnd)}`);
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
