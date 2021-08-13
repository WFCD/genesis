'use strict';

const SQL = require('sql-template-strings');
const mysql = require('mysql2/promise');
const path = require('path');
const fs = require('fs');

const { assetBase, platforms } = require('../CommonFunctions');
const logger = require('../Logger');

const I18n = require('./I18n');

const avatarPrefix = `https://cdn.discordapp.com/avatars/${process.env.BOT_USER_ID}`;

const props = (obj) => {
  const p = [];
  for (; obj != null; obj = Object.getPrototypeOf(obj)) { // eslint-disable-line no-param-reassign
    const op = Object.getOwnPropertyNames(obj);
    for (let i = 0; i < op.length; i += 1) {
      if (p.indexOf(op[i]) === -1) { p.push(op[i]); }
    }
  }
  return p.filter(thing => !['db', 'constructor', '__defineGetter__', '__defineSetter__', 'hasOwnProperty', '__lookupGetter__',
    '__lookupSetter__', 'isPrototypeOf', 'propertyIsEnumerable', 'toString', 'valueOf', '__proto__',
    'toLocaleString'].includes(thing));
};

/**
  * Command Context
  * @typedef {Object} CommandContext
  * @property {string} platform The channel's configured platform
  * @property {string} prefix The channel's configured command prefix
  * @property {string} language Language to localize, if possible
  * @property {boolean} allowCustom Whether or not to allow custom commands in this channel
  * @property {boolean} allowInline Whether or not to allow inline commands in this channel
  * @property {boolean} defaultRoomsLocked Whether or not to set private rooms
  *  created from this channel to locked
  * @property {boolean} defaultNoText Whether or not to create a text chat with private chats
  * @property {boolean} createPrivateChannel Whether or not private chats
  *  are allowed to be created here
  * @property {boolean} defaultShown Whether or not private chats created here are shown by default
  * @property {string} tempCategory Temp category to put private chats in when created.
  *   Makes text chats not be created.
  * @property {boolean} settings.cc.ping Whether or not to ping in custom commands called here
  * @property {boolean} respondToSettings Whether or not to respond to settings changes.
  *  Changes are applied no matter the value.
  * @property {Object} webhook Webhook information for this channel
  * @property {string} webhook.id Webhook id
  * @property {string} webhook.token Webhook token
  * @property {string} webhook.name Webhook name (can be overrided)
  * @property {string} webhook.avatar Webhook avatar (can be overrided)
  * @property {Object} lfg Channel configs per-platform where LFG posts will be put.
  * @property {Discord.Channel} lfg.pc PC lfg channel
  * @property {Discord.Channel} lfg.ps4 PS4 lfg channel
  * @property {Discord.Channel} lfg.swi Switch lfg channel
  * @property {Discord.Channel} lfg.xb1 XB1 lfg channel
  * @property {boolean} isBlacklisted whether or not the user
  *   calling the command is blacklisted from the bot
  * @property {boolean} isOwner whether or not the user
  *   calling the command is blacklisted from the bot
 *  @property {WorldStateClient?} ws Worldstate Client
 *  @property {Logger} logger Logger
 *  @property {I18n} i18n internationalization string handler
 *  @property {Database} settings interface for the database
 *  @property {boolean} ephemerate whether or not to hide (make ephemeral) interaction responses
 *  @property {InteractionHandler|CommandHandler} handler access to a command's handler
  */

/**
 * Persistent storage for the bot
 * @mixes BlacklistQueries
 * @mixes BuildQueries
 * @mixes CustomCommandQueries
 * @mixes DBMQueries
 * @mixes DynamicVoiceQueries
 * @mixes PermissionsQueries
 * @mixes PingsQueries
 * @mixes PromocodeQueries
 * @mixes RatioQueries
 * @mixes SettingsQueries
 * @mixes StatisticsQueries
 * @mixes StreamQueries
 * @mixes TrackingQueries
 * @mixes WelcomeQueries
 * @class
 */
module.exports = class Database {
  /**
   * @param {Genesis} bot Bot to load the settings for
   */
  constructor(bot) {
    this.bot = bot;
    this.logger = logger;

    this.clusterId = process.env.CLUSTER_ID || 0;

    this.scope = (process.env.SCOPE || 'bot').toLowerCase();

    this.defaults = {
      prefix: '/',
      respond_to_settings: true,
      platform: 'pc',
      language: 'en',
      delete_after_respond: true,
      delete_response: true,
      createPrivateChannel: false,
      deleteExpired: false,
      allowCustom: false,
      allowInline: false,
      defaultRoomsLocked: true,
      defaultNoText: false,
      defaultShown: false,
      tempCategory: false,
      'settings.cc.ping': true,
      ephemerate: true,
    };

    const opts = {
      supportBigNumbers: true,
      bigNumberStrings: true,
      host: process.env.MYSQL_HOST || 'localhost',
      port: process.env.MYSQL_PORT || 3306,
      user: process.env.MYSQL_USER || 'genesis',
      password: process.env.MYSQL_PASSWORD,
      database: process.env.MYSQL_DB || 'genesis',
    };

    try {
      this.db = mysql.createPool(opts);
    } catch (e) {
      this.logger.fatal(e);
    }

    this.#loadChildren();
  }

  /**
   * Copy functions from class to this class... theoretically
   * @param {Object} queriesClass class instance
   * @returns {undefined} doesn't return anything
   */
  static #copyChildQueries (queriesClass) {
    const keys = props(queriesClass);
    keys.forEach((key) => {
      if (key !== 'db') {
        // eslint-disable-next-line no-use-before-define
        Database.prototype[key] = queriesClass[key];
      }
    });
  }

  /**
   * Dynamically load child query classes
   *
   * Avoids lots of manual imports, but can be dangerous on a shared OS.
   *
   * Make sure your bot is in a secured folder
   *  if you're worried about shard space.
   */
  #loadChildren () {
    const dbRoot = path.join(__dirname, 'DatabaseQueries');
    fs.readdirSync(dbRoot)
      .filter(f => f.endsWith('.js'))
      .forEach((file) => {
        // eslint-disable-next-line global-require, import/no-dynamic-require
        const QClass = require(path.join(dbRoot, file));
        const qInstance = new QClass(this.db);
        Database.#copyChildQueries(qInstance);
      });
  }

  init() {
    this.defaults = this.scope === 'bot'
      ? {
        ...this.defaults,
        username: this.bot.client.user.username,
        avatar: `${assetBase}/img/avatar.png`,
      } : {
        ...this.defaults,
        username: process.env.DEF_USER || 'Genesis',
        avatar: `${assetBase}/img/avatar.png`,
      };
  }

  /**
   * Query the database
   * @param {string} query query string
   * @returns {mysql.Connection.query}
   */
  async query(query) {
    try {
      return this.db.query(query);
    } catch (e) {
      logger.error(e);
      return undefined;
    }
  }

  debugQuery(query) {
    const { strings, values } = JSON.parse(JSON.stringify(query));
    const tokens = [];
    strings.forEach((str, ind) => {
      tokens.push(JSON.stringify(str));
      if (values[ind]) {
        tokens.push(values[ind]);
      }
    });
    this.logger.error(tokens.join(''));
  }

  /**
   * Gets the current count of guilds and channels
   * @returns {Promise}
   */
  async getChannelAndGuildCounts() {
    const query = SQL`select count(distinct guild_id) as countGuilds, count(distinct id) as countChannels from channels;`;
    const [rows] = await this.query(query);
    if (rows) {
      return {
        channels: rows.countChannels,
        guilds: rows.countGuilds,
      };
    }
    return {};
  }

  /**
   * Get context (including settings) for a command in a channel
   * @param {Discord.Channel} channel channel to get settings for
   * @param {Discord.User} user user to check for specific settings for
   * @returns {CommandContext} context
   */
  async getCommandContext(channel, user) {
    this.getChannelSetting(channel, 'prefix'); // ensure it's set at some point

    if (!channel.id) {
      channel = { id: channel }; // eslint-disable-line no-param-reassign
    }

    const settings = ['webhookId', 'webhookToken', 'webhookName',
      'webhookAvatar', 'language', 'platform'];

    if (this.scope === 'bot') {
      settings.push(...['platform', 'prefix', 'allowCustom', 'allowInline', 'defaultRoomsLocked',
        'defaultNoText', 'defaultShown', 'createPrivateChannel', 'tempCategory',
        'lfgChannel', 'settings.cc.ping', 'language', 'respond_to_settings',
        'lfgChannel.swi', 'lfgChannel.ps4', 'lfgChannel.xb1', 'delete_after_respond', 'ephemerate']);

      if (platforms.length > 4) {
        platforms.forEach((platform, index) => {
          if (index > 3) {
            settings.push(`lfgChannel.${platform}`);
          }
        });
      }
    }

    const query = SQL`SELECT setting, val FROM settings where channel_id = ${channel.id}
      and setting in (`;
    settings.forEach((setting, index) => {
      query.append(index !== (settings.length - 1) ? SQL`${setting}, ` : SQL`${setting}`);
    });
    query.append(SQL`);`);
    const [rows] = await this.query(query);
    let context = {
      webhook: {},
    };
    if (rows) {
      rows.map(row => ({
        setting: row.setting,
        value: row.val,
      })).forEach((row) => {
        if (row.setting === 'webhookAvatar' && !row.value.startsWith('http')) {
          // handle sending hashes
          row.value = `${avatarPrefix}/${row.value}.png`;
        }
        if (row.setting.indexOf('webhook') === -1) {
          context[`${row.setting}`] = row.value;
        } else {
          context.webhook[`${row.setting.replace('webhook', '').toLowerCase()}`] = row.value;
        }
      });
      if (!context.platform) {
        context.platform = this.defaults.platform;
        this.setChannelSetting(channel, 'platform', this.defaults.platform);
      }

      if (!context.prefix) {
        context.prefix = this.defaults.prefix;
      }

      if (!context.language) {
        context.language = this.defaults.language.substr(0, 2);
        this.setChannelSetting(channel, 'language', this.defaults.language.substr(0, 2));
      } else if (context.language.length > 2) {
        this.setChannelSetting(channel, 'language', context.language.substr(0, 2));
        context.language = context.language.substr(0, 2);
      }

      if (typeof context.allowCustom === 'undefined') {
        context.allowCustom = this.defaults.allowCustom;
      } else {
        context.allowCustom = context.allowCustom === '1';
      }
      if (typeof context.allowInline === 'undefined') {
        context.allowInline = this.defaults.allowInline;
      } else {
        context.allowInline = context.allowInline === '1';
      }

      if (typeof context.defaultRoomsLocked === 'undefined') {
        context.defaultRoomsLocked = this.defaults.defaultRoomsLocked;
      } else {
        context.defaultRoomsLocked = context.defaultRoomsLocked === '1';
      }

      if (typeof context.defaultNoText === 'undefined') {
        context.defaultNoText = this.defaults.defaultNoText;
      } else {
        context.defaultNoText = context.defaultNoText === '1';
      }

      if (typeof context.defaultShown === 'undefined') {
        context.defaultShown = this.defaults.defaultShown;
      } else {
        context.defaultShown = context.defaultShown === '1';
      }

      if (typeof context['settings.cc.ping'] === 'undefined') {
        context['settings.cc.ping'] = this.defaults['settings.cc.ping'];
      } else {
        context['settings.cc.ping'] = context['settings.cc.ping'] === '1';
      }

      if (typeof context.createPrivateChannel === 'undefined') {
        context.createPrivateChannel = this.defaults.createPrivateChannel;
      } else {
        context.createPrivateChannel = context.createPrivateChannel === '1';
      }

      if (!(context.webhook.id && context.webhook.token)) {
        context.webhook = undefined;
      }

      if (context.tempCategory && channel.guild.channels.cache.has(context.tempCategory.trim())) {
        context.tempCategory = channel.guild.channels.cache.get(context.tempCategory.trim());
      } else {
        context.tempCategory = undefined;
      }

      if (context.lfgChannel) {
        context.lfg = {};
        context.lfg.pc = channel.guild.channels.cache.get(context.lfgChannel);
        delete context.lfgChannel;
      }

      if (context.delete_after_respond) {
        context.deleteCommand = parseInt(context.delete_after_respond, 10) === 1;
        delete context.delete_after_respond;
      } else {
        context.deleteCommand = this.defaults.delete_after_respond;
      }

      platforms.forEach((platform) => {
        if (context[`lfgChannel.${platform}`]) {
          if (!context.lfg) {
            context.lfg = {};
          }
          context.lfg[platform] = channel.guild.channels.cache.get(context[`lfgChannel.${platform}`]);
          delete context[`lfgChannel.${platform}`];
        }
      });

      if (typeof context.respond_to_settings === 'undefined') {
        context.respondToSettings = this.defaults.respond_to_settings;
      } else {
        context.respondToSettings = context.respond_to_settings === '1';
        delete context.respond_to_settings;
      }

      if (typeof context.ephemerate === 'undefined') context.ephemerate = true;
      else context.ephemerate = context.ephemerate === '1';
    } else {
      context = {
        platform: this.defaults.platform,
        prefix: this.defaults.prefix,
        language: this.defaults.language,
        allowCustom: this.defaults.allowCustom === '1',
        allowInline: this.defaults.allowInline === '1',
        defaultRoomsLocked: this.defaults.defaultRoomsLocked === '1',
        defaultNoText: this.defaults.defaultNoText === '1',
        createPrivateChannel: this.defaults.createPrivateChannel === '1',
        'settings.cc.ping': this.defaults['settings.cc.ping'] === '1',
        respondToSettings: this.defaults.respond_to_settings,
        deleteCommand: this.defaults.delete_after_respond,
        ephemerate: true,
      };
    }
    if (user) {
      context.isBlacklisted = await this.isBlacklisted(user.id,
        channel.guild ? channel.guild.id : 0);
      context.isOwner = user.id === this.bot.owner;
    }
    context.channel = channel;
    context.i18n = I18n.use(context.language);
    return context;
  }
}