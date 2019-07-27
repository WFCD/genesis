'use strict';

 const fetch = require('node-fetch');
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
    }).then(data => data.json());
  }

   async search(endpoint, query) {
    this.logger.debug(`searching ${endpoint} for ${query}`);
    return fetch(`${apiBase}/${endpoint}/search/${query}`).then(data => data.json());
  }
}

 module.exports = WorldStateClient;
