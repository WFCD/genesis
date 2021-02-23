'use strict';

const moment = require('moment');
const Cache = require('flat-cache');
require('colors');
const EventEmitter = require('events');

const TwitchApi = require('./TwitchClient');
const logger = require('../../Logger');
const channels = require('../../resources/twitch.json');

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

const refreshRate = Number.parseInt(process.env.TWITCH_REFRESH || 60000, 10);

const forceHydrate = (process.argv[2] || '').includes('--hydrate');

class TwitchMonitor extends EventEmitter {
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

  static #MIN_POLL_INTERVAL_MS = 30000;

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

  async start() {
    if (!channels.length) {
      logger.warn('No channels configured', 'TM');
      return;
    }

    if (forceHydrate) {
      await TwitchApi.hydrateToken();
    }

    // Configure polling interval
    let checkIntervalMs = refreshRate;
    if (Number.isNaN(checkIntervalMs) || checkIntervalMs < TwitchMonitor.MIN_POLL_INTERVAL_MS) {
      // Enforce minimum poll interval to help avoid rate limits
      checkIntervalMs = TwitchMonitor.MIN_POLL_INTERVAL_MS;
    }
    setInterval(() => {
      this.refresh('Periodic refresh');
    }, checkIntervalMs + 1000);

    // Immediate refresh after startup
    setTimeout(() => {
      this.refresh('Initial refresh after start-up');
    }, 1000);

    // Ready!
    logger.debug(`(${checkIntervalMs}ms interval) Configured stream status polling for channels: ${channels.join(', ')}`, 'TM');
  }

  async refresh(reason) {
    const now = moment();
    logger.silly(`Refreshing now (${reason || 'No reason'})`, 'TM');

    // Refresh all users periodically
    if (this.#lastUserRefresh === null || now.diff(moment(this.#lastUserRefresh), 'minutes') >= 10) {
      this.#pendingUserRefresh = true;
      try {
        this.#handleUserList(await TwitchApi.fetchUsers(channels));
      } catch (err) {
        logger.warn(`Error in users refresh: ${err.message || err}`, 'TM');
      } finally {
        if (this.#pendingUserRefresh) {
          this.#pendingUserRefresh = false;
          this.refresh('Got Twitch users, need to get streams');
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

  #handleUserList (users) {
    const namesSeen = [];

    users.forEach((user) => {
      const prevUserData = this.#userData[user.id] || { };
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

  #handleGameList (games) {
    const gotGameNames = [];

    games.forEach((game) => {
      const gameId = game.id;

      const prevGameData = this.#gameData[gameId] || { };
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

  async #handleStreamList (streams) {
    // Index channel data & build list of stream IDs now online
    const nextOnlineList = [];
    const nextGameIdList = [];

    for (const stream of streams) {
      const channelName = stream.user_name.toLowerCase();

      if (stream.type === 'live') {
        nextOnlineList.push(channelName);
      }

      // logger.debug(`${channelName} last seen as ${this.#statesDb.getKey(channelName)}`);

      if (typeof this.#statesDb.getKey(channelName) === 'undefined') {
        this.#statesDb.setKey(channelName, stream.type);
        this.#statesDb.save(true);
      }

      const userDataBase = this.#userData[stream.user_id] || { };
      const prevStreamData = this.#streamData[channelName] || { };

      this.#streamData[channelName] = { ...userDataBase, ...prevStreamData, ...stream };
      this.#streamData[channelName].game = (stream.game_id
        && this.#gameData[stream.game_id]) || null;
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
    }
    this.#statesDb.setKey('all', this.#streamData);

    for (const channel of channels) {
      if (!streams.find(s => s.user_login === channel)
        && this.#statesDb.getKey(channel) === 'live') {
        // logger.debug(`${channel} has gone offline`);
        this.#handleChannelLiveUpdate(
          this.#streamData[channel] || { type: 'offline', user_login: channel }, false,
        );
        this.#statesDb.setKey(channel, 'offline');
      }
    }
    this.#statesDb.save(true); // save after all are updated

    if (!haveEqualValues(this.#watchingGameIds, nextGameIdList)) {
      // We need to refresh game info
      this.#watchingGameIds = nextGameIdList;
      this.#pendingGameRefresh = true;
      this.refresh('Need to request game data');
    }
  }

  #handleChannelLiveUpdate (streamData, isOnline) {
    let success = true;

    try {
      if (isOnline) {
        this.emit('live', streamData);
      } else {
        this.emit('offline', streamData);
      }
    } catch (err) {
      logger.warn('Event emit failed.', 'TM');
      success = false;
    }
    return success;
  }

  async #spotLoadGame (gameId) {
    this.#handleGameList(await TwitchApi.fetchGames([gameId]));
    return this.#gameData[gameId];
  }

  async #spotLoadStream (channel) {
    return this.#handleStreamList(await TwitchApi.fetchStreams([channel]));
  }

  async #spotLoadUser (user) {
    return this.#handleUserList(await TwitchApi.fetchUsers([user]));
  }
}

module.exports = TwitchMonitor;
