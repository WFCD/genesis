'use strict';

const CommandHandler = require('./CommandHandler.js');
const Discord = require('discord.js');
const md = require('node-md-config');
const WorldStateCache = require('./WorldStateCache.js');
const Database = require('./settings/Database.js');
const Tracker = require('./Tracker.js');
const MessageManager = require('./settings/MessageManager.js');
const Notifier = require('./notifications/Notifier.js');

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
 * Check if private rooms have expired and are empty. If not, do nothing.
 * If so, delete the corresponding channels.
 * @param  {Genesis} self    Bot instance
 * @param  {number} shardId shard identifier
 */
function checkPrivateRooms(self, shardId) {
  self.logger.debug(`Checking private rooms... Shard ${shardId}`);
  self.settings.getPrivateRooms()
     .then((privateRooms) => {
       self.logger.debug(`Private rooms... ${privateRooms.length}`);
       privateRooms.forEach((room) => {
         if (room && room.voiceChannel && room.textChannel) {
           const now = new Date();
           if (((now.getTime() + (now.getTimezoneOffset() * 60000)) - room.createdAt
                > self.channelTimeout)
             && room.voiceChannel.members.size === 0) {
             if (room.textChannel.deletable) {
               self.logger.debug(`Deleting text channel... ${room.textChannel.id}`);
               room.textChannel.delete()
                 .then(() => {
                   if (room.voiceChannel.deletable) {
                     self.logger.debug(`Deleting text channel... ${room.voiceChannel.id}`);
                     return room.voiceChannel.delete();
                   }
                   return new Promise();
                 })
                 .then(() => {
                   if (room.textChannel.deletable && room.voiceChannel.deletable) {
                     self.settings
                      .deletePrivateRoom(room.guild, room.textChannel, room.voiceChannel);
                   }
                 });
             }
           }
         }
       });
     });
}

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
   * @param  {WarframeNexusQuery} [options.nexusQuerier] API for querying nexus-stats' warframe api
   * @param  {Object}           [options.caches]     json-fetch-cache for each Warframe worldstate
   * @param {NexusFetcher}      [options.nexusFetcher] Nexus Stats direct api
   */
  constructor(discordToken, logger, { shardId = 0, shardCount = 1, prefix = process.env.PREFIX,
                                     mdConfig = md, owner = null, nexusQuerier = {},
                                     caches = {}, nexusFetcher } = {}) {
    /**
     * The Discord.js client for interacting with Discord's API
     * @type {Discord.Client}
     * @private
     */
    this.client = new Discord.Client({
      fetchAllMembers: true,
      ws: {
        compress: true,
        large_threshold: 1000,
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

    this.caches = caches;

    this.nexusFetcher = nexusFetcher;

    this.channelTimeout = 300000;

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
     * Command handler for this Bot
     * @type {CommandHandler}
     * @private
     */
    this.commandHandler = new CommandHandler(this);


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
      this.worldStates[platform] = new WorldStateCache(platform, worldStateTimeout);
    });

    /**
     * The languages that are useable for the bot
     * @type {Array.<string>}
     */
    this.languages = ['en-us'];

    this.tracker = new Tracker(this.logger, this.client, this.shardClient, { shardId, shardCount });

    this.messageManager = new MessageManager(this);

    // Notification emitter
    this.notifier = new Notifier(this);

    this.nexusQuerier = nexusQuerier;

    this.commandHandler.loadCommands();

    this.setupHandlers();
  }

  setupHandlers() {
    this.client.on('ready', () => this.onReady());
    this.client.on('message', message => this.onMessage(message));

    this.client.on('guildCreate', guild => this.onGuildCreate(guild));
    this.client.on('guildDelete', guild => this.onGuildDelete(guild));
    this.client.on('channelCreate', channel => this.onChannelCreate(channel));
    this.client.on('channelDelete', channel => this.onChannelDelete(channel));

    // kill on disconnect so a new instance can be spawned
    this.client.on('disconnect', (event) => {
      this.logger.debug(`Disconnected with close event: ${event.code}`);
      // process.exit(4);
    });

    this.client.on('error', error => this.logger.error(error));
    this.client.on('warn', warning => this.logger.warning(warning));
  }

  /**
   * Creates the database schema and logs in the bot to Discord
   */
  start() {
    this.settings.createSchema(this.client).then(() => {
      this.logger.debug('Schema created');
      return this.client.login(this.token);
    }).then((t) => {
      this.logger.debug(`Logged in with token ${t}`);
      this.notifier.start();
    }).catch((e) => {
      this.logger.error(e.message);
      this.logger.fatal(e);
      process.exit(1);
    });
  }

  /**
   * Perform actions when the bot is ready
   */
  onReady() {
    this.logger.debug(`${this.client.user.username} ready!`);
    this.logger.debug(`Bot: ${this.client.user.username}#${this.client.user.discriminator}`);
    this.client.user.setGame(`@${this.client.user.username} help (${this.shardId + 1}/${this.shardCount})`);
    this.settings.ensureData(this.client);
    this.readyToExecute = true;

    const self = this;
    setInterval(checkPrivateRooms, self.channelTimeout, self, self.shardId);
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
   * @param {Guild} guild The guild that was created
   */
  onGuildCreate(guild) {
    if (!guild.available) {
      return;
    }
    this.settings.addGuild(guild).then(() => {
      this.logger.debug(`Joined guild ${guild} (${guild.id}`);
      guild.defaultChannel.send(`**${this.client.user.username.toUpperCase()} ready! Type ` +
        `\`${this.prefix}help\` for help**`);
    }).catch(this.logger.error);
  }

  /**
   * Handle deleting or leaving a guild
   * @param {Guild} guild The guild that was deleted/left
   */
  onGuildDelete(guild) {
    if (!guild.available) {
      return;
    }
    this.settings.deleteGuild(guild)
      .then(() => {
        this.logger.debug(`Guild deleted : ${guild.name} (${guild.id})`);
      })
      .catch(this.logger.error);
  }

  /**
   * Handle channel creation
   * @param {Channel} channel The channel that was created
   */
  onChannelCreate(channel) {
    if (channel.type === 'voice') {
      return;
    }
    if (channel.type === 'text') {
      this.settings.addGuildTextChannel(channel).then(() => {
        this.logger.debug(`Text channel ${channel.name} (${channel.id}) created in guild ` +
          `${channel.guild.name} (${channel.guild.id})`);
      }).catch(() => this.settings.addGuild(channel.guild)
        .then(() => this.settings.addGuildTextChannel(channel)));
    } else {
      this.settings.addDMChannel(channel).then(() => {
        this.logger.debug(`DM channel with id ${channel.id} created`);
      }).catch(this.logger.error);
    }
  }

  /**
   * Handle channel deletion
   * @param {Channel} channel The channel that was deleted
   */
  onChannelDelete(channel) {
    if (channel.type === 'voice') {
      return;
    }
    this.settings.deleteChannel(channel).then(() => {
      this.logger.debug(`Channel with id ${channel.id} deleted`);
    }).catch(this.logger.error);
  }
}

module.exports = Genesis;
