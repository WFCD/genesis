'use strict';

const fetch = require('./Fetcher');
const { apiBase } = require('../CommonFunctions');

class WorldStateClient {
  constructor(logger = console) {
    this.logger = logger;
  }

  async get(endpoint, platform = 'pc', language = 'en') {
    this.logger.silly(`fetching ${endpoint} for ${platform} with lang(${language})`);
    return fetch(`${apiBase}/${platform.toLowerCase()}/${endpoint}?language=${language}&platform=${platform}`, {
      headers: {
        platform,
        'Accept-Language': language,
      },
    });
  }

  async g(endpoint, platform = 'pc', language = 'en') {
    this.logger.silly(`fetching ${endpoint}`);
    return fetch(`${apiBase}/${endpoint}?language=${language}&platform=${platform}`, {
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
    this.logger.silly(`pricechecking ${query}`);
    return fetch(`${apiBase}/pricecheck/${type}/${query}?language=${language}&platform=${platform}`, {
      headers: {
        platform,
        'Accept-Language': language,
      },
    });
  }
}

module.exports = WorldStateClient;
