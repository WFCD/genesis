'use strict';

const fetch = require('./Fetcher');
const { apiBase } = require('../CommonFunctions');

/**
 * WorldState interaction client
 * @type {Object}
 */
module.exports = class WorldStateClient {
  /**
   * Create a worldstate client
   * @param {Console} logger logger for debugging requests
   */
  constructor(logger = console) {
    this.logger = logger;
  }

  async get(endpoint, platform = 'pc', language = 'en') {
    this.logger.silly(`fetching ${endpoint} for ${platform} with lang(${language})`);
    return fetch(`${apiBase}/${platform.toLowerCase()}/${endpoint}`, {
      headers: {
        platform,
        'Accept-Language': language,
      },
    });
  }

  async g(endpoint, platform = 'pc', language = 'en') {
    this.logger.silly(`fetching ${endpoint}`);
    return fetch(`${apiBase}/${endpoint}`, {
      headers: {
        platform,
        'Accept-Language': language,
      },
    });
  }

  async search(endpoint, query) {
    this.logger.silly(`searching ${endpoint} for ${query}`);
    return fetch(`${apiBase}/${endpoint}/search/${encodeURIComponent(query)}`);
  }

  async pricecheck(query, { type = 'attachment', platform = 'pc', language = 'en' }) {
    this.logger.info(`pricechecking ${query}`);
    const url = `${apiBase}/pricecheck/${type || 'attachment'}/${query}?language=${language || 'en'}&platform=${platform || 'pc'}`;
    this.logger.info(`fetching ${url}`);
    return fetch(url, {
      headers: {
        platform,
        'Accept-Language': language,
      },
    });
  }
};
