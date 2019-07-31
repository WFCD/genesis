'use strict';

const fetch = require('./Fetcher');
const { apiBase } = require('../CommonFunctions');

class WorldStateClient {
  constructor(logger = console) {
    this.logger = logger;
  }

  async get(endpoint, platform = 'pc', language = 'en') {
    this.logger.debug(`fetching ${endpoint} for ${platform} with lang(${language})`);
    return fetch(`${apiBase}/${platform.toLowerCase()}/${endpoint}`, {
      headers: {
        'Accept-Language': language,
      },
    });
  }

  async g(endpoint, platform = 'pc', language = 'en') {
    this.logger.debug(`fetching ${endpoint}`);
    return fetch(`${apiBase}/${endpoint}`, {
      headers: {
        'Accept-Language': language,
        Platform: platform,
      },
    });
  }

  async search(endpoint, query) {
    this.logger.debug(`searching ${endpoint} for ${query}`);
    return fetch(`${apiBase}/${endpoint}/search/${encodeURIComponent(query)}`);
  }

  async pricecheck(query, { type = 'attachment', platform = 'pc', language = 'en' }) {
    this.logger.debug(`pricechecking ${query}`);
    return fetch(`${apiBase}/pricecheck/${type}/${query}`, {
      headers: {
        'Accept-Language': language,
        Platform: platform,
      },
    });
  }
}

module.exports = WorldStateClient;
