'use strict';

const Command = require('../Command.js');
const md = require('node-md-config');

/**
 * Describes the Armor command
 */
class AddBlacklist extends Command {
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
    this.commandId = 'blacklist.remove';
    // eslint-disable-next-line no-useless-escape
    this.commandRegex = new RegExp(`^${regexPrefix}enable (.+)`, 'i');
    this.commandHelp = `${prefix}enable command  | Enables a command [Admin only]`;
    this.logger = logger;
    this.blacklistable = false;
    this.requiresAuth = true;
  }

  run(message, { settings = null, commandHandler = null, stringManager = null } = {}) {
    const query = this.commandRegex
      .exec(message.cleanContent.match(this.commandRegex)[0])[1].trim();
    const blacklistables = commandHandler.getBlacklistableCommands();
    settings.getBlacklistedCommands(message.channel.id)
        .then((blacklist) => {
          if ((blacklist.indexOf(query) === -1 && blacklistables.indexOf(query) !== -1) || query === 'all') {
            settings.setBlacklistCommand(message.channel.id, query, false)
              .then((r) => {
                this.logger.debug(r);
                if (query !== 'all') {
                  stringManager.getString('command_removed_blacklist', message, { command: query })
                    .then(str => message.reply(str))
                    .catch(this.logger.error);
                } else {
                  stringManager.getString('all_command_removed_blacklist', message, { command: query })
                    .then(str => message.reply(str))
                    .catch(this.logger.error);
                }
              })
              .catch(this.logger.error);
          } else if (blacklistables.indexOf(query) === -1) {
            stringManager.getString('command_not_blacklistable', message, { command: query })
              .then(str => message.reply(str))
              .catch(this.logger.error);
          }
        })
        .catch(err => this.logger.error(err));
    if (message.deletable) {
      message.delete(5000);
    }
  }
}

module.exports = AddBlacklist;
