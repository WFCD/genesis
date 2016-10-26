'use strict';

const ping = require('ping').promise;
const md = require('node-md-config');

const Command = require('../Command.js');

/**
 * Describes the Wiki command
 */
class Ping extends Command {
  /**
   * Constructs a callable command
   * @param  {Logger}           logger                The logger object
   * @param  {string}           [options.prefix]      Prefix for calling the bot
   * @param  {string}           [options.regexPrefix] Escaped prefix for regex for the command
   * @param  {MarkdownSettings} [options.mdConfig]    The markdown settings
   */
  // eslint-disable-next-line no-useless-escape
  constructor(logger, { mdConfig = md, regexPrefix = '\/', prefix = '/' } = {}) {
    super(logger, { mdConfig, regexPrefix, prefix });
    this.commandId = 'genesis.ping';
    this.commandRegex = new RegExp(`^${regexPrefix}ping$`, 'ig');
    this.commandHelp = `${prefix}ping            | Ping Genesis to test connectivity`;
  }

  run(message) {
    const hosts = ['content.warframe.com', 'forums.warframe.com', 'wf.christx.tw', 'store.warframe.com'];
    const results = [];

    hosts.forEach((host) => {
      ping.probe(host)
        .then((result) => {
          results.push(`${result.alive ? ':white_check_mark:' : ':x:'} ${result.host}, pinged in ${typeof result.time !== 'undefined' ? result.time : '\u221E'}ms`);
        });
    });

    const now = Date.now();
    message.reply('Testing Ping')
    .then((msg) => {
      const afterSend = Date.now();
      msg.edit(`PONG in \`${afterSend - now}ms\`${this.md.lineEnd}${results.join(this.md.lineEnd)}`)
        .then((editedMessage) => {
          editedMessage.delete(100000);
          if (message.deletable) {
            message.delete(10000);
          }
        })
        .catch(this.logger.error);
    })
    .catch(this.logger.error);
  }
}

module.exports = Ping;
