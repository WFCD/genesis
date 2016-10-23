'use strict';

const ping = require('ping').promise;

const Command = require('../Command.js');


/**
 * Describes the Wiki command
 */
class Ping extends Command {
  constructor(bot) {
    super(bot);
    this.commandId = 'genesis.ping';
    this.commandRegex = new RegExp(`^${bot.escapedPrefix}ping$`, 'ig');
    this.commandHelp = `${bot.prefix}ping            | Ping Genesis to test connectivity`;
    this.md = bot.md;
  }

  get id() {
    return this.commandId;
  }

  get command() {
    return this.commandRegex;
  }

  get help() {
    return this.commandHelp;
  }

  run(message) {
    message.channel.startTyping();
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
        .catch(this.bot.errorHandle);
    })
    .catch(this.bot.errorHandle);
    message.channel.stopTyping();
  }
}

module.exports = Ping;
