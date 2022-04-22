import path from 'node:path';
import Cache from 'flat-cache';
import cron from 'cron';

import fetch from '../../utilities/Fetcher.js';
import logger from '../../utilities/Logger.js';

const { CronJob: Job } = cron;
const urls = {
  helix: 'https://api.twitch.tv/helix',
  token: 'https://id.twitch.tv/oauth2/token',
};
const forceHydrate = (process.argv[2] || '').includes('--hydrate');

/**
 * Twitch Helix API helper ("New Twitch API").
 *
 * All credit to https://github.com/roydejong/timbot for composition and structure
 */
export default class TwitchClient {
  static #tokenCache = Cache.load('accessToken', path.resolve('.cache'));

  /**
   * Refresh cronjob - self-starting
   * @type {cron.CronJob}
   */
  static #refreshJob = new Job('0 0 */3 * * *', this.hydrateToken.bind(this), undefined, true);

  static get accessToken() {
    return this.#tokenCache.getKey('token');
  }

  /**
   * Sets the access token in the cache
   * @param {string} token twitch access token to cache
   */
  static set #accessToken(token) {
    this.#tokenCache.setKey('token', token);
    this.#tokenCache.save(true);
  }

  /**
   * Get the twitch refresh token
   * @returns {string}
   */
  static get refreshToken() {
    return this.#tokenCache.getKey('refresh');
  }

  /**
   * Sets the refresh token in the cache
   * @param {string} token twitch refresh token to cache
   */
  static set #refreshToken(token) {
    this.#tokenCache.setKey('refresh', token);
    this.#tokenCache.save(true);
  }

  static get requestOptions() {
    return {
      baseURL: urls.helix,
      headers: {
        'Client-ID': process.env.TWITCH_CLIENT_ID,
        Authorization: `Bearer ${this.accessToken}`,
      },
    };
  }

  /**
   * @typedef {Error} TwitchError
   * @property {Object} response response object for errors
   */
  /**
   * Handle twitch API errors
   * @param  {TwitchError} err error reply
   */
  static #handleApiError(err) {
    const res = err.response || {};

    if (res.data && res.data.message) {
      logger.debug(
        `API request failed with Helix error:\n${res.data.message}\n(${res.data.error}/${res.data.status})`,
        'TwitchApi'
      );
    } else {
      logger.debug(`API request failed with error: ${err.message || err}`, 'TwitchApi');
    }
  }

  /**
   * Get Data from the Twitch API
   * @param {string} urlPath path to request
   * @param {string} params query params
   * @private
   * @static
   * @returns {Promise<Array<Object>>}
   */
  static async #apiGet(urlPath, params) {
    if (!this.accessToken) await this.hydrateToken();
    if (!this.accessToken && !this.refreshToken) return [];

    const url = `${this.requestOptions.baseURL}/${urlPath}?${params}`;
    try {
      const res = await fetch(url, {
        headers: {
          'Client-ID': process.env.TWITCH_CLIENT_ID,
          Authorization: `Bearer ${this.accessToken}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        return data.data || [];
      }
      logger.error(res.statusText);
      return [];
    } catch (e) {
      this.#handleApiError(e);
      return [];
    }
  }

  /**
   * Hydrate cache with a new token.
   * @type {Array}
   * @returns {Promise<boolean>} whether it was updated
   * @async
   */
  static async hydrateToken() {
    if (!this.refreshToken || forceHydrate) {
      if (this.refreshToken && this.refreshToken.includes('Invalid refresh token')) {
        this.#tokenCache.removeKey('refresh');
      }

      const atParams = [
        { key: 'client_id', val: process.env.TWITCH_CLIENT_ID },
        { key: 'client_secret', val: process.env.TWITCH_CLIENT_SECRET },
        { key: 'grant_type', val: 'client_credentials' },
      ];

      const res = await fetch(`${urls.token}?${atParams.map(({ key, val }) => `${key}=${val}`).join('&')}`, {
        method: 'POST',
      });

      if (res) {
        const initAccessToken = res.access_token;
        this.#refreshToken = initAccessToken;
        this.#accessToken = initAccessToken;
        return true;
      }
      logger.error(`error refreshing refresh token: ${res.error.message}`, 'Twitch');
      return false;
    }

    const params = [
      { key: 'client_id', val: process.env.TWITCH_CLIENT_ID },
      { key: 'client_secret', val: process.env.TWITCH_CLIENT_SECRET },
      { key: 'grant_type', val: 'refresh_token' },
      { key: 'refresh_token', val: encodeURIComponent(this.refreshToken) },
    ];
    const url = `${urls.token}?${params.map(({ key, val }) => `${key}=${val}`).join('&')}`;

    try {
      const res = await fetch(url, { method: 'post' });

      if (res) {
        const token = res.access_token;
        logger.info(token, 'Twitch');
        this.#accessToken = token;
        return true;
      }
      logger.error(`error retrieving refresh token: ${res.error.message}`, 'Twitch');
      logger.warn(url);

      if (res.error.message === 'Invalid refresh token') {
        this.#refreshToken = undefined;
        return this.hydrateToken();
      }
    } catch (e) {
      logger.error(e, 'Twitch');
    }

    return false;
  }

  /**
   * Fetch stream data
   * @param {Array<string>} channels list of channels to fetch
   * @returns {Promise<Array<Object>>} array of stream data
   */
  static async fetchStreams(channels) {
    const params = channels.map((c) => `user_login=${c}`).join('&');
    return this.#apiGet('streams', params);
  }

  /**
   * Fetch Twitch Users
   * @param {Array<string>} channelNames list of channels to fetch
   * @returns {Promise<Array<Object>>} array of stream data
   */
  static async fetchUsers(channelNames) {
    const params = channelNames.map((c) => `login=${c}`).join('&');
    return this.#apiGet('users', params);
  }

  /**
   * Get Game data per gameId
   * @param  {Array<string>}  gameIds Twitch game identifiers
   * @returns {Promise<Array<Object>>}        array of game data
   */
  static async fetchGames(gameIds) {
    const params = gameIds.map((c) => `id=${c}`).join('&');
    return this.#apiGet('games', params);
  }
}
