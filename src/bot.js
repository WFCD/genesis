'use strict';

const Discord = require('discord.js');

const {
  Client, WebhookClient, Intents, Constants: { Events },
} = Discord;

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
   * @param  {string}           [prefix]     Prefix for calling the bot
   * @param  {number[]}         [shards]     Ids of shards to control
   * @param  {Object}           [commandManifest] Manifest of commands
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
      ],
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
    this.client.on('ready',
      async () => this.eventHandler.handleEvent({ event: 'ready', args: [] }));
    this.client.on(Events.MESSAGE_CREATE,
      async message => this.eventHandler
        .handleEvent({ event: Events.MESSAGE_CREATE, args: [message] }));

    this.client.on(Events.GUILD_CREATE,
      async guild => this.eventHandler.handleEvent({ event: Events.GUILD_CREATE, args: [guild] }));
    this.client.on(Events.GUILD_DELETE,
      async guild => this.eventHandler.handleEvent({ event: Events.GUILD_DELETE, args: [guild] }));
    this.client.on(Events.CHANNEL_CREATE,
      async channel => this.eventHandler
        .handleEvent({ event: Events.CHANNEL_CREATE, args: [channel] }));
    this.client.on(Events.CHANNEL_DELETE,
      async channel => this.eventHandler
        .handleEvent({ event: Events.CHANNEL_DELETE, args: [channel] }));

    this.client.on(Events.MESSAGE_DELETE,
      async message => this.eventHandler
        .handleEvent({ event: Events.MESSAGE_DELETE, args: [message] }));
    this.client.on(Events.MESSAGE_DELETE_BULK,
      async messages => this.eventHandler
        .handleEvent({ event: Events.MESSAGE_DELETE_BULK, args: [messages] }));

    this.client.on(Events.GUILD_MEMBER_UPDATE,
      async (oldMember, newMember) => this.eventHandler
        .handleEvent({ event: Events.GUILD_MEMBER_UPDATE, args: [oldMember, newMember] }));
    this.client.on(Events.GUILD_MEMBER_ADD,
      async guildMember => this.eventHandler
        .handleEvent({ event: Events.GUILD_MEMBER_ADD, args: [guildMember] }));
    this.client.on(Events.GUILD_MEMBER_REMOVE,
      async guildMember => this.eventHandler
        .handleEvent({ event: Events.GUILD_MEMBER_REMOVE, args: [guildMember] }));
    this.client.on(Events.GUILD_BAN_ADD,
      async (guild, user) => this.eventHandler
        .handleEvent({ event: Events.GUILD_BAN_ADD, args: [guild, user] }));
    this.client.on(Events.GUILD_BAN_REMOVE,
      async (guild, user) => this.eventHandler
        .handleEvent({ event: Events.GUILD_BAN_REMOVE, args: [guild, user] }));

    this.client.on(Events.INTERACTION_CREATE,
      async interaction => this.eventHandler
        .handleEvent({ event: Events.INTERACTION_CREATE, args: [interaction] }));

    this.client.on(Events.DISCONNECT,
      (event) => { this.logger.fatal(`Disconnected with close event: ${event.code}`); });
    this.client.on(Events.ERROR, this.logger.error);
    this.client.on(Events.WARN, this.logger.warn);
    this.client.on(Events.DEBUG, (message) => {
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
