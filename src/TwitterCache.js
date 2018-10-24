'use strict';

const Twitter = require('twitter');

class TwitterCache {
  constructor(params, timeout, logger = console) {
    this.timeout = timeout;
    this.client = new Twitter(params.clientInfo);
    this.toWatch = params.toWatch;
    this.currentData = null;
    this.lastUpdated = null;
    this.updateInterval = setInterval(() => this.update(), timeout);
    this.logger = logger;
    this.update();
  }

  update() {
    const promises = [];
    for (let i = 0; i < this.toWatch.length; i += 1) {
      promises.push(this.client.get('statuses/user_timeline', { screen_name: this.toWatch[i].acc_name, tweet_mode: 'extended', count: 1 }));
    }

    this.updating = Promise.all(promises).then((data) => {
      this.lastUpdated = Date.now();
      delete this.currentData;
      this.currentData = [];
      for (let x = 0; x < this.toWatch.length; x += 1) {
        this.currentData.push({ id: `twitter.${this.toWatch[x].plain}`, uniqueId: `${data[x][0].id}`, tweets: data[x] });
      }
      this.updating = null;
      return this.currentData;
    }).catch((error) => {
      this.updating = null;
      this.logger.error(error);
    });
    return this.updating;
  }

  async getData() {
    if (this.updating) {
      return this.updating;
    }
    return this.currentData;
  }
};

module.exports = TwitterCache;
