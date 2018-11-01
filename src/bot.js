'use strict';

const Discord = require('discord.js');
const md = require('node-md-config');
const CommandManager = require('./CommandManager.js');
const Database = require('./settings/Database.js');
const EventHandler = require('./EventHandler');
const MessageManager = require('./settings/MessageManager.js');
const Notifier = require('./notifications/Notifier.js');
const Tracker = require('./Tracker.js');
const WorldStateCache = require('./WorldStateCache.js');

/**
 * A collection of strings that are used by the parser to produce markdown-formatted text
 * @typedef {Object.<string>} MarkdownSettings
 * @property {string} lineEnd      - Line return character
 * @property {string} blockEnd     - Block end string
 * @property {string} doubleReturn - Double line return string
 * @property {string} linkBegin    - Link begin string
 * @property {string} linkMid      - Link middle string
 * @property {string} linkEnd      - Link end string
 * @property {string} bold         - String for denoting bold text
 * @property {string} italic       - String for denoting italicized text
 * @property {string} underline    - String for denoting underlined text
 * @property {string} strike       - String for denoting striked-through text
 * @property {string} codeLine     - String for denoting in-line code
 * @property {string} codeBlock    - String for denoting multi-line code blocks
 */

/**
 * Class describing Genesis bot
 */
class Genesis {
  /**
   * @param  {string}           discordToken         The token used to authenticate with Discord
   * @param  {Logger}           logger               The logger object
   * @param  {Object}           [options]            Bot options
   * @param  {number}           [options.shardId]    The shard ID of this instance
   * @param  {number}           [options.shardCount] The total number of shards
   * @param  {string}           [options.prefix]     Prefix for calling the bot
   * @param  {MarkdownSettings} [options.mdConfig]   The markdown settings
   */
  constructor(discordToken, logger, {
    shardId = 0,
    shardCount = 1,
    prefix = process.env.PREFIX,
    mdConfig = md,
    owner = null,
    controlHook = null,
    commandManifest = null,
  } = {}) {
    /**
     * The Discord.js client for interacting with Discord's API
     * @type {Discord.Client}
     * @private
     */
    this.client = new Discord.Client({
      fetchAllMembers: false,
      ws: {
        compress: true,
      },
      shardId,
      shardCount,
    });

    this.shardId = shardId;
    this.shardCount = shardCount;

    /**
     * Discord login token for is bot
     * @type {string}
     * @private
     */
    this.token = discordToken;

    /**
     * Discord.js API
     * @type {Discord}
     */
    this.discord = Discord;

    /**
     * The logger object
     * @type {Logger}
     * @private
     */
    this.logger = logger;

    /**
     * Prefix for calling the bot, for use with matching strings.
     * @type {string}
     * @private
     */
    this.escapedPrefix = prefix.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');

    /**
     * Prefix for calling the bot, for use with messages.
     * @type {string}
     * @private
     */
    this.prefix = prefix;

    /**
     * The markdown settings
     * @type {MarkdownSettings}
     * @private
     */
    this.md = mdConfig;

    /**
     * Whether or not the bot is ready to execute.
     * This allows stopping commands before servers and users are ready.
     * @type {boolean}
     */
    this.readyToExecute = false;

    /**
     * The bot's owner
     * @type {string}
     */
    this.owner = owner;

    /**
     * Shard client for communicating with other shards
     * @type {Discord.ShardClientUtil}
     */
    this.shardClient = new Discord.ShardClientUtil(this.client);

    /**
     * Persistent storage for settings
     * @type {Database}
     */
    this.settings = new Database({
      host: process.env.MYSQL_HOST || 'localhost',
      port: process.env.MYSQL_PORT || 3306,
      user: process.env.MYSQL_USER || 'genesis',
      password: process.env.MYSQL_PASSWORD,
      database: process.env.MYSQL_DB || 'genesis',
    }, this);

    /**
     * Objects holding worldState data, one for each platform
     * @type {Object.<WorldStateCache>}
     */
    this.worldStates = {};

    /**
     * The platforms that Warframe exists for
     * @type {Array.<string>}
     */
    this.platforms = ['pc', 'ps4', 'xb1'];

    const worldStateTimeout = process.env.WORLDSTATE_TIMEOUT || 60000;

    this.platforms.forEach((platform) => {
      this.worldStates[platform] = new WorldStateCache(platform, worldStateTimeout, this.logger);
    });

    /**
     * The languages that are useable for the bot
     * @type {Array.<string>}
     */
    this.languages = ['en-us'];

    this.tracker = new Tracker(this.logger, this.client, this.shardClient, {
      shardId,
      shardCount,
    });

    this.messageManager = new MessageManager(this);

    /**
     * Command handler for this Bot
     * @type {CommandManager}
     * @private
     */
    this.commandManager = new CommandManager(this, commandManifest.map((cmd) => {
      // eslint-disable-next-line no-param-reassign
      cmd.regex = new RegExp(cmd.regex.body, cmd.regex.flags);
      return cmd;
    }));

    /**
     * Handles events, such as member joins, bans, delets, etc.
     * @type {EventHandler}
     */
    this.eventHandler = new EventHandler(this);

    // Notification emitter
    this.notifier = new Notifier(this);

    this.controlHook = controlHook;
  }

  async setupHandlers() {
    this.client.on('ready', async () => this.eventHandler.handleEvent({ event: 'onReady', args: [] }));
    this.client.on('message', async message => this.eventHandler.handleEvent({ event: 'message', args: [message] }));

    this.client.on('guildCreate', async guild => this.eventHandler.handleEvent({ event: 'guildCreate', args: [guild] }));
    this.client.on('guildDelete', async guild => this.eventHandler.handleEvent({ event: 'guildDelete', args: [guild] }));
    this.client.on('channelCreate', async channel => this.eventHandler.handleEvent({ event: 'channelCreate', args: [channel] }));
    this.client.on('channelDelete', async channel => this.eventHandler.handleEvent({ event: 'channelDelete', args: [channel] }));

    this.client.on('messageDelete', async message => this.eventHandler.handleEvent({ event: 'messageDelete', args: [message] }));
    this.client.on('messageDeleteBulk', async messages => this.eventHandler.handleEvent({ event: 'messageDeleteBulk', args: [messages] }));

    this.client.on('guildMemberAdd', async guildMember => this.eventHandler.handleEvent({ event: 'guildMemberAdd', args: [guildMember] }));
    this.client.on('guildMemberRemove', async guildMember => this.eventHandler.handleEvent({ event: 'guildMemberRemove', args: [guildMember] }));
    this.client.on('guildBanAdd', async (guild, user) => this.eventHandler.handleEvent({ event: 'guildBanAdd', args: [guild, user] }));
    this.client.on('guildBanRemove', async (guild, user) => this.eventHandler.handleEvent({ event: 'guildBanRemove', args: [guild, user] }));

    this.client.on('disconnect', (event) => { this.logger.fatal(`Disconnected with close event: ${event.code}`); });
    this.client.on('error', error => this.logger.error(error));
    this.client.on('warn', warning => this.logger.warning(warning));
  }

  /**
   * Creates the database schema and logs in the bot to Discord
   */
  async start() {
    await this.settings.createSchema(this.client);
    this.logger.debug('Schema created');
    await this.commandManager.loadCommands();
    await this.eventHandler.loadHandles();

    this.setupHandlers();
    const t = await this.client.login(this.token);
    this.logger.debug(`Logged in with token ${t}`);

    try {
      await this.notifier.start();
    } catch (err) {
      this.logger.error(err);
      this.logger.fatal(err);
      process.exit(0);
    }
  }
}

module.exports = Genesis;
