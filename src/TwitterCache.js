'use strict';

const { apiBase } = require('./CommonFunctions.js');
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
    console.log('Sending a request to Twitter');
    const promises = [];

    for(let i=0;i<this.toWatch.length;i++) {
      promises.push(this.client.get('statuses/user_timeline', {screen_name: this.toWatch[i], count: 2}));
    }

    this.updating = Promise.all(promises).then((data) => {
      console.log('All promises resolved');
      this.lastUpdated = Date.now();
      delete this.currentData;
      this.currentData = [];
      for(let x=0;x<this.toWatch.length;x++) {
        this.currentData.push({id: `twitter.${this.toWatch[x].toLowerCase().slice(1)}`, tweets: data[x]});
      }
      console.log(this.currentData);

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

  
}

module.exports = TwitterCache;
