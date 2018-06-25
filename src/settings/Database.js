'use strict';

const SQL = require('sql-template-strings');
const mysql = require('mysql2/promise');
const Promise = require('bluebird');

const BuildQueries = require('./DatabaseQueries/BuildQueries');
const WelcomeQueries = require('./DatabaseQueries/WelcomeQueries');
const CustomCommandQueries = require('./DatabaseQueries/CustomCommandQueries');
const SettingsQueries = require('./DatabaseQueries/SettingsQueries');
const TrackingQueries = require('./DatabaseQueries/TrackingQueries');
const PingsQueries = require('./DatabaseQueries/PingsQueries');
const PermissionsQueries = require('./DatabaseQueries/PermissionsQueries');
const DBMQueries = require('./DatabaseQueries/DBMQueries');
const PrivateRoomQueries = require('./DatabaseQueries/PrivateRoomQueries');
const PromocodeQueries = require('./DatabaseQueries/PromocodeQueries');

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
 * Connection options for the database
 * @typedef {Object} DbConnectionOptions
 * @property {string} [host=localhost] - The hostname of the database
 * @property {number} [port=3306] - The port number to connect to
 * @property {string} user - The user to authenticate as
 * @property {string} password - The password for that user
 * @property {string} database - The database to use
 */

/**
 * Persistent storage for the bot
 */
class Database {
  /**
   * @param {DbConnectionOptions} dbOptions Connection options for the database
   * @param {Genesis} bot Bot to load the settings for
   */
  constructor(dbOptions, bot) {
    this.bot = bot;
    this.logger = bot.logger;

    const opts = {
      supportBigNumbers: true,
      bigNumberStrings: true,
      Promise,
    };
    Object.assign(opts, dbOptions);
    this.db = mysql.createPool(opts);

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
    };

    const queryClasses = [
      new BuildQueries(this.db),
      new WelcomeQueries(this.db),
      new CustomCommandQueries(this.db),
      new SettingsQueries(this.db),
      new TrackingQueries(this.db),
      new PingsQueries(this.db),
      new PermissionsQueries(this.db),
      new DBMQueries(this.db),
      new PrivateRoomQueries(this.db),
      new PromocodeQueries(this.db),
    ];

    queryClasses.forEach((queryClass) => {
      this.copyChildrenQueries(queryClass);
    });
  }

  /**
   * Copy funcitonns from class to this class... theoretically
   * @param {Object} queriesClass class instance
   * @returns {undefined} doesn't return anything
   */
  copyChildrenQueries(queriesClass) {
    const keys = props(queriesClass);
    keys.forEach((key) => {
      if (key !== 'db') {
        Database.prototype[key] = queriesClass[key];
      }
    });
    this.logger.debug(`Imported Functions: ${props(this).length}`);
  }

  /**
   * Gets the current count of guilds and channels
   * @returns {Promise}
   */
  async getChannelAndGuildCounts() {
    const query = 'select count(distinct guild_id) as countGuilds, count(distinct id) as countChannels from channels;';
    const res = await this.db.query(query);
    if (res[0]) {
      return {
        channels: res[0].countChannels,
        guilds: res[0].countGuilds,
      };
    }
    return {};
  }

  /**
   * Get context (including settings) for a command in a channel
   * @param {Discord.Channel} channel channel to get settings for
   * @returns {Object} context
   */
  async getCommandContext(channel) {
    this.getChannelSetting(channel, 'prefix'); // ensure it's set at some point
    const query = SQL`SELECT setting, val FROM settings where channel_id = ${channel.id}
      and setting in ('platform', 'prefix', 'allowCustom', 'allowInline', 'webhookId',
        'webhookToken', 'webhookName', 'webhookAvatar', 'defaultRoomsLocked',
        'defaultNoText', 'defaultShown', 'createPrivateChannel', 'tempCategory',
        'lfgChannel', 'settings.cc.ping');`;
    const res = await this.db.query(query);
    let context = {
      webhook: {},
    };
    if (res[0]) {
      res[0].map(row => ({
        setting: row.setting,
        value: row.val,
      })).forEach((row) => {
        if (row.setting.indexOf('webhook') === -1) {
          context[`${row.setting}`] = row.value;
        } else {
          context.webhook[`${row.setting.replace('webhook', '').toLowerCase()}`] = row.value;
        }
      });
      if (!context.platform) {
        context.platform = this.defaults.platform;
      }

      if (!context.prefix) {
        context.prefix = this.defaults.prefix;
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

      if (context.tempCategory && channel.guild.channels.has(context.tempCategory.trim())) {
        context.tempCategory = channel.guild.channels.get(context.tempCategory.trim());
      } else {
        context.tempCategory = undefined;
      }

      if (context.lfgChannel && channel.guild.channels.has(context.lfgChannel.trim())) {
        context.lfgChannel = channel.guild.channels.get(context.lfgChannel.trim());
      } else {
        context.lfgChannel = undefined;
      }
    } else {
      context = {
        platform: this.defaults.platform,
        prefix: this.defaults.prefix,
        allowCustom: this.defaults.allowCustom === '1',
        allowInline: this.defaults.allowInline === '1',
        defaultRoomsLocked: this.defaults.defaultRoomsLocked === '1',
        defaultNoText: this.defaults.defaultNoText === '1',
        createPrivateChannel: this.defaults.createPrivateChannel === '1',
        'settings.cc.ping': this.defaults['settings.cc.ping'] === '1',
      };
    }
    context.channel = channel;
    return context;
  }
}

module.exports = Database;
