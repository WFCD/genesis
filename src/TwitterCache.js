'use strict';

const Twitter = require('twitter');

const toWatch = require('./resources/tweeters.json');
const { determineTweetType } = require('./CommonFunctions.js');

class TwitterCache {
  constructor(logger = console) {
    this.logger = logger;

    this.timeout = process.env.TWITTER_TIMEOUT || 60000;
    const clientInfo = {
      consumer_key: process.env.TWITTER_KEY,
      consumer_secret: process.env.TWITTER_SECRET,
      bearer_token: process.env.TWITTER_BEARER_TOKEN,
    };

    try {
      this.client = new Twitter(clientInfo);
      // don't attempt anything else if authentication fails
      this.toWatch = toWatch;
      this.currentData = null;
      this.lastUpdated = null;
      this.updateInterval = setInterval(() => this.update(), this.timeout);
      this.update();
    } catch (err) {
      this.client = undefined;
      this.logger.error(err);
    }
  }

  async update() {
    this.logger.debug('Starting Twitter update...');
    const promises = [];
    if (!this.toWatch) {
      this.updating = undefined;
      this.logger.debug('Not processing twitter, no data to watch.');
      return this.updating;
    }

    this.toWatch.forEach((watchable) => {
      if (this.client) {
        promises.push(this.client.get('statuses/user_timeline', {
          screen_name: watchable.acc_name,
          tweet_mode: 'extended',
          count: 1,
        }));
      }
    });
    const data = await Promise.all(promises);

    try {
      this.lastUpdated = Date.now();
      delete this.currentData;
      this.currentData = this.toWatch ? this.toWatch.map((watchable, index) => {
        const tweets = data[index];
        const type = determineTweetType(tweets[0]);
        return {
          id: `twitter.${watchable.plain}.${type}`,
          uniqueId: String(tweets[0].id),
          tweets,
        };
      }) : [];
      this.updating = undefined;
      return this.currentData;
    } catch (err) {
      this.updating = undefined;
      this.logger.error(JSON.stringify(err));
    }
    return this.updating;
  }

  async getData() {
    if (this.updating) {
      return this.updating;
    }
    return this.currentData;
  }
}

module.exports = TwitterCache;
