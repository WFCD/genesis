'use strict';

const { Client, WebhookClient, Intents } = require('discord.js');

const WorldStateClient = require('./resources/WorldStateClient');
const CommandManager = require('./CommandManager');
const EventHandler = require('./EventHandler');

const MessageManager = require('./settings/MessageManager');
const Database = require('./settings/Database');
const logger = require('./Logger');
const unlog = ['WS_CONNECTION_TIMEOUT'];

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
   * @param  {string}           [options.prefix]     Prefix for calling the bot
   * @param  {MarkdownSettings} [options.mdConfig]   The markdown settings
   * @param  {number[]}         [options.shards]     Ids of shards to control
   * @param  {Object}           [options.commandManifest] Manifest of commands
   */
  constructor(discordToken, {
    prefix = process.env.PREFIX,
    owner = null,
    commandManifest = null,
    shards = [0],
  } = {}) {
    /**
     * The Discord.js client for interacting with Discord's API
     * @type {Discord.Client}
     * @private
     */
    this.client = new Client({
      fetchAllMembers: false,
      ws: {
        compress: true,
      },
      shards,
      shardCount: Number(process.env.SHARDS || 1),
      disabledEvents: [
        'VOICE_SERVER_UPDATE',
        'PRESENSE_UPDATE',
        'USER_SETTINGS_UPDATE',
        'GUILD_INTEGRATIONS_UPDATE',
        'GUILD_EMOJIS_UPDATE',
        'GUILD_UPDATE',
        'CHANNEL_PINS_UPDATE',
      ],
      presence: {
        status: 'dnd',
        afk: false,
        activities: [{
          name: 'Starting...',
        }],
      },
      allowedMentions: { parse: ['users', 'roles'], repliedUser: false },
      intents: [
        Intents.FLAGS.GUILD_MESSAGES,
        Intents.FLAGS.GUILDS,
        Intents.FLAGS.GUILD_INTEGRATIONS,
        Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
      ]
    });

    /**
     * Discord login token for is bot
     * @type {string}
     * @private
     */
    this.token = discordToken;

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
     * Persistent storage for settings
     * @type {Database}
     */
    this.settings = new Database(this);

    this.ws = new WorldStateClient(this.logger);
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
    this.shards = shards;
    this.shardTotal = process.env.SHARDS || 1;
    this.clusterId = process.env.CLUSTER_ID || 0;
    // this.tracker = new Tracker(this);

    // this.feeder; // for debugging

    if (process.env.CONTROL_WH_ID) {
      this.controlHook = new WebhookClient(process.env.CONTROL_WH_ID, process.env.CONTROL_WH_TOKEN);
    }
    if (process.env.BUG_WH_ID) {
      this.bugHook = new WebhookClient(process.env.BUG_WH_ID, process.env.BUG_WH_TOKEN);
    } else if (process.env.CONTROL_WH_ID) {
      this.bugHook = this.controlHook;
    }
  }

  async setupHandlers() {
    this.client.on('ready', async () => this.eventHandler.handleEvent({ event: 'ready', args: [] }));
    this.client.on('message', async message => this.eventHandler.handleEvent({ event: 'message', args: [message] }));

    this.client.on('guildCreate', async guild => this.eventHandler.handleEvent({ event: 'guildCreate', args: [guild] }));
    this.client.on('guildDelete', async guild => this.eventHandler.handleEvent({ event: 'guildDelete', args: [guild] }));
    this.client.on('channelCreate', async channel => this.eventHandler.handleEvent({ event: 'channelCreate', args: [channel] }));
    this.client.on('channelDelete', async channel => this.eventHandler.handleEvent({ event: 'channelDelete', args: [channel] }));

    this.client.on('messageDelete', async message => this.eventHandler.handleEvent({ event: 'messageDelete', args: [message] }));
    this.client.on('messageDeleteBulk', async messages => this.eventHandler.handleEvent({ event: 'messageDeleteBulk', args: [messages] }));

    this.client.on('guildMemberUpdate', async (oldMember, newMember) => this.eventHandler.handleEvent({ event: 'guildMemberUpdate', args: [oldMember, newMember] }));
    this.client.on('guildMemberAdd', async guildMember => this.eventHandler.handleEvent({ event: 'guildMemberAdd', args: [guildMember] }));
    this.client.on('guildMemberRemove', async guildMember => this.eventHandler.handleEvent({ event: 'guildMemberRemove', args: [guildMember] }));
    this.client.on('guildBanAdd', async (guild, user) => this.eventHandler.handleEvent({ event: 'guildBanAdd', args: [guild, user] }));
    this.client.on('guildBanRemove', async (guild, user) => this.eventHandler.handleEvent({ event: 'guildBanRemove', args: [guild, user] }));

    this.client.on('interaction', async (interaction) => this.eventHandler.handleEvent({event: 'interaction', args: [interaction]}));

    this.client.on('disconnect', (event) => { this.logger.fatal(`Disconnected with close event: ${event.code}`); });
    this.client.on('error', this.logger.error);
    this.client.on('warn', this.logger.warn);
    this.client.on('debug', (message) => {
      if (/(Sending a heartbeat|Latency of|voice)/i.test(message)) {
        this.logger.silly(message);
        return;
      }
      this.logger.debug(message);
    });
  }

  /**
   * Creates the database schema and logs in the bot to Discord
   */
  async start() {
    await this.settings.createSchema(this.client);
    this.logger.debug('Schema created');
    await this.commandManager.loadCustomCommands();
    await this.eventHandler.loadHandles();

    this.setupHandlers();
    try {
      await this.client.login(this.token);
      this.logger.debug('Logged in with token.');
    } catch (err) {
      const type = ((err && err.toString()) || '').replace(/Error \[(.*)\]: .*/ig, '$1');
      if (!unlog.includes(type)) {
        this.logger.error(err);
      }
      this.logger.fatal(err);
      process.exit(1);
    }
  }
}

module.exports = Genesis;
