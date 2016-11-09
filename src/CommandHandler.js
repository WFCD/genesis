'use strict';

const fs = require('fs');
const path = require('path');
const Settings = require('./settings/Settings.js');
const StringManager = require('./settings/StringManager.js');

const mongoURL = process.env.MONGODB_URL;

/**
 * Describes a CommandHandler for a bot.
 */
class CommandHandler {
  /**
   * Constructs CommandHandler
   * @param {Logger}  logger Simple logging class for logging errors and debugging
   * @param {Genesis} bot    Bot to derive prefix for commands from
   */
  constructor(logger, bot) {
    /**
     * Simple logging class for logging errors and debugging
     * @type {Logger}
     * @private
     */
    this.logger = logger;

    this.bot = bot;

    /**
     * Array of command objects that can be called
     * @type {Array<Command>}
     * @private
     */
    this.commands = this.loadCommands();

    /**
     * The settings for this bot
     * @type {Settings}
     * @private
     */
    this.settings = new Settings(mongoURL, this.logger, this);

    /**
     * Manages strings, allowing for internationalization
     * @type {StringManager}
     */
    this.stringManager = new StringManager(this.settings);

    /**
     * Designates the owner of the bot, allows usages of bot-only commands
     * @type {number}
     */
    this.owner = bot.owner;
  }

  /**
   * Prepare the commands from the `commands` directory.
   * @returns {Array.<Command>} The loaded commands
   */
  loadCommands() {
    const commandDir = path.join(__dirname, 'commands');
    const files = fs.readdirSync(commandDir);
    this.logger.debug(`Loading commands: ${files.join(', ')}`);

    return files.map((f) => {
      let command;
      try {
        // eslint-disable-next-line import/no-dynamic-require, global-require
        const Cmd = require(`${commandDir}/${f}`);
        command = new Cmd(this.logger, {
          prefix: this.bot.prefix,
          regexPrefix: this.bot.escapedPrefix,
          commandHandler: this,
        });
      } catch (err) {
        this.logger.error(err);
        return null;
      }
      this.logger.debug(`Adding ${command.id}`);
      return command;
    });
  }

  /**
   * Handle the command contained in the message contents, if any.
   *
   * @param {Message} message Message whose command should be checked and handled
   */
  handleCommand(message) {
    this.logger.debug(`Handling \`${message.content}\``);

    this.commands.forEach((command) => {
      if (command.call.test(message.content)) {
        this.logger.debug(`Matched: ${command.id}`);
        this.checkCanAct(command, message)
          .then((canAct) => {
            this.logger.debug(`Can act: ${canAct}`);
            if (canAct === true) {
              command.run(message, {
                settings: new Settings(mongoURL, this.logger, this),
                commandHandler: this,
                stringManager: this.stringManager,
              });
            } else {
              this.settings.getRespond(message.channel.id)
                .then((canRespond) => {
                  if (canRespond) {
                    this.stringManager.getString('cannot_reply', message, { command: command.id })
                      .then(str => message.reply(str));
                  }
                })
                .catch(this.logger.error);
            }
          })
          .catch(this.logger.error);
      }
    });
  }

  /**
   * Check if the current command being called is able to be performed for the user calling it.
   * @param   {Command} command  command to process to see if it can be called
   * @param   {string} message message to derive data from.
   * @returns {Promise<boolean>} Whether or not the ucrrent command can be called by the author
   */
  checkCanAct(command, message) {
    return new Promise((resolve, reject) => {
      this.settings.getBlacklistedCommands(message.channel.id)
          .then((blacklist) => {
            if (command.ownerOnly) {
              if (message.author.id === this.owner) {
                resolve(true);
              } else {
                this.logger.debug(`Author: ${message.author.id}\nOwner: ${this.owner}`);
                resolve(false);
              }
            } else if (blacklist.indexOf(command.id) === -1) {
              resolve(true);
            } else if (message.channel.permissionsFor(message.author)
                .hasPermission('MANAGE_ROLES_OR_PERMISSIONS')
                && command.requiresAuth) {
              resolve(true);
            } else {
              this.settings.getOverride(message.channel.id)
                .then((override) => {
                  if (override && (message.channel.permissionsFor(message.author).hasPermission('MANAGE_ROLES_OR_PERMISSIONS') || message.author.id === this.owner)) {
                    resolve(true);
                  } else {
                    resolve(false);
                  }
                })
                .catch(err => reject(err));
            }
          })
          .catch(err => reject(err));
    });
  }

  /**
   * Get list of blacklistable command ids
   * @returns {Array<string>} Array of blacklistable command ids
   */
  getBlacklistableCommands() {
    return this.commands.filter((command) => {
      if (command.blacklistable) {
        return true;
      }
      return false;
    }).map(command =>
       command.id
    );
  }
}

module.exports = CommandHandler;
