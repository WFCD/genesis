'use strict';

const CommandHandler = require('./CommandHandler.js');
const Discord = require('discord.js');
const md = require('node-md-config');

/**
 * Set the log level value based on passed string
 * @param {string} level Log level string to set level with
 * @returns {number} value of the log level to be set
 */
function setLogLevel(level) {
  let val = 0;
  switch (level) {
    case 'debug':
      val = 5;
      break;
    case 'info':
      val = 4;
      break;
    case 'warning':
      val = 3;
      break;
    case 'error':
      val = 2;
      break;
    case 'fatal':
      val = 1;
      break;
    default:
      break;
  }
  return val;
}

/**
 * Class describing Genesis bot
 */
class Genesis {
  /**
   * @param {Raven.Client} ravenClient the Raven Client for logging
   */
  constructor(ravenClient) {
    /**
     * The Discord.js client for interacting with Discord's API
     * @type {Discord.Client}
     * @private
     */
    this.client = new Discord.Client(
      {
        autoReconnect: true,
        fetch_all_members: true,
        api_request_method: 'burst',
        ws: {
          compress: true,
          large_threshold: 1000,
        },
      });

    /**
     * Discord login token for is bot
     * @type {string}
     * @private
     */
    this.token = process.env.TOKEN;

    /**
     * Raven Client for logging
     * @type {Raven.Client}
     * @private
     */
    this.ravenClient = ravenClient;

    /**
     * Prefix for calling the bot
     * @type {string}
     * @private
     */
    this.prefix = process.env.PREFIX || '/';

    /**
     * Log level for limiting what level of logging to send to Sentry.io
     * @type {string}
     * @private
     */
    this.logLevel = setLogLevel(process.env.LOG_LEVEL.toLowerCase() || 'fatal');

    /**
     * The markdown settings
     * @type {MarkdownSettings}
     * @private
     */
    this.md = md;

    /**
     * The escaped prefix, for use with command regex.
     * @type {string}
     */
    this.escapedPrefix = this.prefix.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');

    this.client.on('ready', () => this.onReady());
    this.client.on('guildCreate', guild => this.onGuildCreate(guild));
    this.client.on('message', message => this.onMessage(message));

    if (typeof this.token === 'undefined') {
      this.logFatalError('No Token');
    }

    /**
     * Whether or not the bot is ready to execute.
     * This allows stopping commands before servers and users are ready.
     * @type {boolean}
     */
    this.readyToExecute = false;

    this.consoleIfLowLog = process.env.CONTINUE_TO_CONSOLE || false;

    /**
     * Command handler for this Bot
     * @type {CommandHandler}
     * @private
     */
    this.commandHandler = new CommandHandler(this);
  }

  /**
   * Log a fatal error message
   * @param {string} message message to log
   */
  logFatalError(message) {
    if (this && this.logLevel && this.logLevel > 0) {
      this.ravenClient.captureMessage(`Fatal Error | ${message}`, {
        level: 'fatal',
      });
    } else if (this && this.consoleIfLowLog) {
      // eslint-disable-next-line no-console
      console.error(message);
    }
  }

  /**
   * Log an error message
   * @param {string} error message to log
   */
  errorHandle(error) {
    if (this && this.logLevel && this.logLevel > 1) {
      this.ravenClient.captureException(error);
    } else if (this && this.consoleIfLowLog) {
      // eslint-disable-next-line no-console
      console.error(error);
    }
  }

  /**
   * Log a warning message
   * @param {string} message message to log
   */
  warn(message) {
    if (this && this.logLevel && this.logLevel > 2) {
      this.ravenClient.captureMessage(`Warn        | ${message}`, {
        level: 'warning',
      });
    } else if (this && this.consoleIfLowLog) {
      // eslint-disable-next-line no-console
      console.warn(`Warn        | ${message}`);
    }
  }

  /**
   * Log an informational message
   * @param {string} message message to log
   */
  logInfo(message) {
    if (this && this.logLevel && this.logLevel > 3) {
      this.ravenClient.captureMessage(`Info        | ${message}`, {
        level: 'info',
      });
    } else if (this && this.consoleIfLowLog) {
      // eslint-disable-next-line no-console
      console.log(`Info        | ${message}`);
    }
  }

  /**
   * Log a debug message
   * @param {string} message message to log
   */
  debug(message) {
    if (this && this.logLevel && this.logLevel > 4) {
      this.ravenClient.captureMessage(`Debug       | ${message}`, {
        level: 'debug',
      });
    } else if (this && this.consoleIfLowLog) {
      // eslint-disable-next-line no-console
      console.log(`Debug       | ${message}`);
    }
  }

  /**
   * Perform actions for starting the bot
   */
  start() {
    this.client.login(this.token)
      .then(this.debug)
      .catch(this.errorHandle);
  }

  /**
   * Perform actions when the bot is ready
   */
  onReady() {
    setTimeout(() => {
      this.debug(`${this.client.user.username} ready!`);
      this.debug(`Log Level: ${this.logLevel}`);
      this.debug(`Bot: ${this.client.user.username}#${this.client.user.discriminator}`);
      this.client.user.setStatus('online', `${this.prefix}help for help`);
      this.readyToExecute = true;
    }, 100);
  }

  /**
   * Handle message
   * @param {Message} message to handle
   */
  onMessage(message) {
    if (this.readyToExecute && message.author.id !== this.client.user.id) {
      this.commandHandler.handleCommand(message);
    }
  }

  /**
   * Handle guild creation
   * @param {Guild} guild handle guild creation
   */
  onGuildCreate(guild) {
    if (!guild.available) {
      return;
    }
    this.debug(`${guild} joined or created.`);
    guild.defaultChannel.sendMessage(`**${this.client.user.username.toUpperCase()} ready! Type ` +
                                     `\`${this.prefix}help\` for help**`);
  }
}

module.exports = Genesis;
