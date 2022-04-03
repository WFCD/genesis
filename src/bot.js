import Discord from 'discord.js';

import WorldStateClient from './utilities/WorldStateClient.js';
import EventHandler from './eventHandlers/EventHandler.js';

import Database from './settings/Database.js';
import logger from './utilities/Logger.js';

const {
  Client,
  WebhookClient,
  Intents,
  Constants: { Events },
} = Discord;

const unlog = {
  debug: ['WS_CONNECTION_TIMEOUT'],
  error: /^(Unknown Message)/gi,
};

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
 * @property {Database} settings
 * @property {Logger} logger
 * @property {EventHandler} eventHandler
 * @property {Discord.Client} client
 */
export default class Genesis {
  /**
   * @param  {string}           discordToken         The token used to authenticate with Discord
   * @param  {Logger}           logger               The logger object
   * @param  {string}           [prefix]     Prefix for calling the bot
   * @param  {number[]}         [shards]     Ids of shards to control
   */
  constructor(discordToken, { prefix = process.env.PREFIX, owner = undefined, shards = [0] } = {}) {
    /**
     * The Discord.js client for interacting with Discord's API
     * @type {Discord.Client}
     * @private
     */
    this.client = new Client({
      allowedMentions: { parse: ['users', 'roles'], repliedUser: false },
      shards,
      shardCount: Number(process.env.SHARDS || 1),
      presence: {
        status: 'dnd',
        afk: false,
        activities: [
          {
            name: 'Starting...',
          },
        ],
      },
      intents: [
        Intents.FLAGS.GUILD_MESSAGES,
        Intents.FLAGS.GUILDS,
        Intents.FLAGS.GUILD_INTEGRATIONS,
        Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
        Intents.FLAGS.GUILD_VOICE_STATES,
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
     * Prefix for calling the bot, for use with messages.
     * @type {string}
     * @private
     */
    this.prefix = prefix;

    /**
     * Whether the bot is ready to execute.
     * This allows stopping commands before servers and users are ready.
     * @type {boolean}
     */
    this.readyToExecute = false;

    /**
     * The bot's owner
     * @type {string}
     */
    this.owner = owner;

    return (async () => {
      /**
       * Persistent storage for settings
       * @type {Database}
       */
      this.settings = await new Database(this);

      this.ws = new WorldStateClient(this.logger);

      /**
       * Handles events, such as member joins, bans, delets, etc.
       * @type {EventHandler}
       */
      this.eventHandler = new EventHandler(this);
      this.shards = shards;
      this.shardTotal = process.env.SHARDS || 1;
      this.clusterId = process.env.CLUSTER_ID || 0;
      // this.tracker = new Tracker(this);

      if (process.env.CONTROL_WH_ID) {
        this.controlHook = new WebhookClient({
          id: process.env.CONTROL_WH_ID,
          token: process.env.CONTROL_WH_TOKEN,
        });
      }
      if (process.env.BUG_WH_ID) {
        this.bugHook = new WebhookClient({
          id: process.env.BUG_WH_ID,
          token: process.env.BUG_WH_TOKEN,
        });
      } else if (process.env.CONTROL_WH_ID) {
        this.bugHook = this.controlHook;
      }
      return this;
    })();
  }

  async setupHandlers() {
    this.client.on(Events.CLIENT_READY, async () =>
      this.eventHandler.handleEvent({ event: Events.CLIENT_READY, args: [] })
    );

    this.client.on(Events.GUILD_CREATE, async (guild) =>
      this.eventHandler.handleEvent({ event: Events.GUILD_CREATE, args: [guild] })
    );
    this.client.on(Events.GUILD_DELETE, async (guild) =>
      this.eventHandler.handleEvent({ event: Events.GUILD_DELETE, args: [guild] })
    );
    this.client.on(Events.CHANNEL_CREATE, async (channel) =>
      this.eventHandler.handleEvent({ event: Events.CHANNEL_CREATE, args: [channel] })
    );
    this.client.on(Events.CHANNEL_DELETE, async (channel) =>
      this.eventHandler.handleEvent({ event: Events.CHANNEL_DELETE, args: [channel] })
    );

    this.client.on(Events.INTERACTION_CREATE, async (interaction) =>
      this.eventHandler.handleEvent({ event: Events.INTERACTION_CREATE, args: [interaction] })
    );

    this.client.on(Events.SHARD_DISCONNECT, (event) => {
      this.logger.error(`Disconnected with close event: ${event.code}`);
    });
    this.client.on(Events.ERROR, (error) => {
      if (!unlog.error.test(error.message)) this.logger.error(error);
    });
    this.client.on(Events.WARN, this.logger.warn);
    this.client.on(Events.DEBUG, (message) => {
      if (/(heartbeat|Latency of|voice|HELLO timeout|CONNECT|Spawning)/i.test(message)) {
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
    await this.settings.createSchema();
    this.logger.debug('Schema created');
    await this.eventHandler.loadHandles();

    await this.setupHandlers();
    try {
      await this.client.login(this.token);
      this.logger.debug('Logged in with token.');
    } catch (err) {
      const type = ((err && err.toString()) || '').replace(/Error \[(.*)]: .*/gi, '$1');
      if (!unlog.debug.includes(type)) {
        this.logger.error(err);
      }
      this.logger.fatal(err);
      process.exit(1);
    }
  }
}
