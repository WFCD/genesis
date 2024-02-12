import EventEmitter from 'node:events';

import moment from 'dayjs';
import Cache from 'flat-cache';

import logger from '../../utilities/Logger.js';
import { twitch as channels } from '../../resources/index.js';

import TwitchApi from './TwitchClient.js';

const haveEqualValues = (a, b) => {
  if (a.length !== b.length) {
    return false;
  }

  a.sort();
  b.sort();

  for (let i = 0; i < a.length; i += 1) {
    if (a[i] !== b[i]) {
      return false;
    }
  }

  return true;
};

const forceHydrate = (process.argv[2] || '').includes('--hydrate');

export default class TwitchMonitor extends EventEmitter {
  static #MIN_POLL_INTERVAL_MS = 30000;
  static #TEN_MINUTES = 600000;
  static #REFRESH_RATE = Number.parseInt(process.env.TWITCH_REFRESH || this.#TEN_MINUTES, 10);

  #userDb;
  #gameDb;
  #statesDb;
  #pendingUserRefresh = true;
  #pendingGameRefresh;
  #watchingGameIds;
  #lastUserRefresh;
  #lastGameRefresh;
  #userData;
  #gameData;
  #activeStreams;
  #streamData;
  #channelLiveCallbacks;
  #channelOfflineCallbacks;
  #recentLive = [];

  constructor() {
    super();
    this.#userDb = Cache.load('users');
    this.#gameDb = Cache.load('games');
    this.#statesDb = Cache.load('states') || {};
    this.#pendingUserRefresh = false;
    this.#pendingGameRefresh = false;
    this.#watchingGameIds = [];
    this.#lastUserRefresh = this.#userDb.getKey('last-update');
    this.#lastGameRefresh = moment();
    this.#userData = this.#userDb.getKey('user-list') || {};
    this.#gameData = this.#gameDb.getKey('game-list') || {};
    this.#activeStreams = [];
    this.#streamData = this.#statesDb.getKey('all') || {};
    this.#channelLiveCallbacks = [];
    this.#channelOfflineCallbacks = [];
  }

  /**
   * Start the Twitch monitor
   * @returns {Promise}
   */
  async start() {
    if (!channels.length) {
      logger.warn('No channels configured', 'TM');
      return;
    }

    if (forceHydrate) {
      await TwitchApi.hydrateToken();
    }

    // Configure polling interval
    let checkIntervalMs = TwitchMonitor.#REFRESH_RATE;
    if (Number.isNaN(checkIntervalMs) || checkIntervalMs < TwitchMonitor.#MIN_POLL_INTERVAL_MS) {
      // Enforce minimum poll interval to help avoid rate limits
      checkIntervalMs = TwitchMonitor.#MIN_POLL_INTERVAL_MS;
    }
    setInterval(() => {
      this.refresh('Periodic refresh');
    }, checkIntervalMs + 1000);

    // Immediate refresh after startup
    setTimeout(() => {
      this.refresh('Initial refresh after start-up');
    }, 1000);

    // Ready!
    logger.debug(
      `(${checkIntervalMs}ms interval) Configured stream status polling for channels: ${channels.join(', ')}`,
      'TM'
    );
  }

  async refresh(reason) {
    const now = moment();
    logger.silly(`Refreshing now (${reason || 'No reason'})`, 'TM');

    // Refresh all users periodically
    if (!this.#lastUserRefresh || now.diff(moment(this.#lastUserRefresh), 'minutes') >= 10) {
      this.#pendingUserRefresh = true;
      try {
        this.#handleUserList(await TwitchApi.fetchUsers(channels));
      } catch (err) {
        logger.warn(`Error in users refresh: ${err.message || err}`, 'TM');
      } finally {
        if (this.#pendingUserRefresh) {
          this.#pendingUserRefresh = false;
          await this.refresh('Got Twitch users, need to get streams');
        }
      }
    }

    // Refresh all games if needed
    if (this.#pendingGameRefresh) {
      try {
        if (this.#watchingGameIds.length) {
          this.#handleGameList(await TwitchApi.fetchGames(this.#watchingGameIds));
        }
      } catch (err) {
        logger.warn(`Error in games refresh ${err.message || err}`, 'TM');
      } finally {
        if (this.#pendingGameRefresh) {
          this.#pendingGameRefresh = false;
        }
      }
    }

    // Refresh all streams
    try {
      await this.#handleStreamList(await TwitchApi.fetchStreams(channels));
    } catch (err) {
      logger.warn(`Error in streams refresh: ${err.message || err}`, 'TM');
      logger.error(err, 'TM');
    }
  }

  /**
   * @typedef {Object} TwitchUser
   * @property {string} id
   * @property {string} display_name
   */

  /**
   * Handle receiving list of users
   * @param {Array<TwitchUser>} users users received to updated and cache
   */
  #handleUserList(users) {
    const namesSeen = [];

    users.forEach((user) => {
      const prevUserData = this.#userData[user.id] || {};
      this.#userData[user.id] = { ...prevUserData, ...user };

      namesSeen.push(user.display_name);
    });

    if (namesSeen.length) {
      logger.silly(`Updated user info: ${namesSeen.join(', ')}`, 'TM');
    }

    this.#lastUserRefresh = moment();

    this.#userDb.setKey('last-update', this.#lastUserRefresh);
    this.#userDb.setKey('user-list', this.#userData);
    this.#userDb.save(true);
  }

  #handleGameList(games) {
    const gotGameNames = [];

    games.forEach((game) => {
      const gameId = game.id;

      const prevGameData = this.#gameData[gameId] || {};
      this.#gameData[gameId] = { ...prevGameData, ...game };

      gotGameNames.push(`${game.id} → ${game.name}`);
    });

    if (gotGameNames.length) {
      logger.silly(`Updated game info: ${gotGameNames.join(', ')}`, 'TM');
    }

    this.#lastGameRefresh = moment();

    this.#gameDb.setKey('last-update', this.#lastGameRefresh);
    this.#gameDb.setKey('game-list', this.#gameData);
    this.#gameDb.save(true);
  }

  #emptyRecentStreams(stream) {
    this.#recentLive = this.#recentLive.filter((s) => s !== stream);
  }

  /**
   * Handle parsing the stream list of data
   * @param {Array<StreamData>} streams streams to handle
   * @returns {Promise<void>}
   */
  async #handleStreamList(streams) {
    // Index channel data & build list of stream IDs now online
    const nextGameIdList = [];
    streams.forEach((stream) => {
      const channelName = stream.user_name.toLowerCase();

      // logger.debug(`${channelName} last seen as ${this.#statesDb.getKey(channelName)}`);

      if (typeof this.#statesDb.getKey(channelName) === 'undefined') {
        this.#statesDb.setKey(channelName, stream.type);
        this.#statesDb.save(true);
      }

      const userDataBase = this.#userData[stream.user_id] || {};
      const prevStreamData = this.#streamData[channelName] || {};

      this.#streamData[channelName] = { ...userDataBase, ...prevStreamData, ...stream };
      this.#streamData[channelName].game = (stream.game_id && this.#gameData[stream.game_id]) || undefined;
      this.#streamData[channelName].user = userDataBase;

      if (this.#statesDb.getKey(channelName) !== 'live' && stream.type === 'live') {
        // logger.debug(`${channelName} has gone online`);
        this.#handleChannelLiveUpdate(this.#streamData[channelName], true);
      }

      if (stream.game_id) {
        nextGameIdList.push(stream.game_id);
      }

      this.#statesDb.setKey(channelName, stream.type);
      this.#statesDb.save(true);
    });
    this.#statesDb.setKey('all', this.#streamData);
    channels.forEach((channel) => {
      if (!streams.find((s) => s.user_login === channel) && this.#statesDb.getKey(channel) === 'live') {
        this.#handleChannelLiveUpdate(this.#streamData[channel] || { type: 'offline', user_login: channel }, false);
        this.#statesDb.setKey(channel, 'offline');
      }
    });
    this.#statesDb.save(true); // save after all are updated

    if (!haveEqualValues(this.#watchingGameIds, nextGameIdList)) {
      // We need to refresh game info
      this.#watchingGameIds = nextGameIdList;
      this.#pendingGameRefresh = true;
      await this.refresh('Need to request game data');
    }
  }

  /**
   * @typedef {Object} StreamData
   * @property {string} user_name
   * @property {string} user_login
   * @property {string} game_id
   * @property {string} type
   * @property {string} user_id
   */

  /**
   * Handle updating a channel to be live
   * @param {StreamData} streamData stream data to set live
   * @param {boolean} isOnline whether or not the account is now online
   * @returns {boolean}
   */
  #handleChannelLiveUpdate(streamData, isOnline) {
    let success = true;

    try {
      if (isOnline && !this.#recentLive.includes(streamData.user_name)) {
        this.emit('live', streamData);
        this.#recentLive.push(streamData.user_name);
        setTimeout(() => {
          this.#emptyRecentStreams(streamData.user_name);
        }, TwitchMonitor.#TEN_MINUTES);
      } else {
        this.emit('offline', streamData);
      }
    } catch (err) {
      logger.warn('Event emit failed.', 'TM');
      success = false;
    }
    return success;
  }

  async spotLoadGame(gameId) {
    this.#handleGameList(await TwitchApi.fetchGames([gameId]));
    return this.#gameData[gameId];
  }

  async spotLoadStream(channel) {
    return this.#handleStreamList(await TwitchApi.fetchStreams([channel]));
  }

  async spotLoadUser(user) {
    await this.#handleUserList(await TwitchApi.fetchUsers([user]));
    return this.#userData[user];
  }
}
