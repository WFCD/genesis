'use strict';

const https = require('https');

const EventEmitter = require('events');

const worldStateURLs = {
  pc: 'https://api.warframestat.us/pc',
  ps4: 'https://api.warframestat.us/ps4',
  xb1: 'https://api.warframestat.us/xb1',
};

class WorldStateCache extends EventEmitter {
  constructor(platform, timeout, logger = console) {
    super();
    this.url = worldStateURLs[platform];
    this.timeout = timeout;
    this.currentData = null;
    this.lastUpdated = null;
    this.updating = null;
    this.platform = platform;
    this.updateInterval = setInterval(() => this.update(), timeout);
    this.logger = logger;
    this.update();
  }

  async getData() {
    if (this.updating) {
      return this.updating;
    }
    return this.currentData;
  }

  update() {
    this.updating = this.httpGet().then((data) => {
      this.lastUpdated = Date.now();
      this.currentData = JSON.parse(data);
      this.updating = null;
      this.emit('newData', this.platform, this.currentData);
      return this.currentData;
    }).catch((err) => {
      this.updating = null;
      this.logger.error(err);
    });
    return this.updating;
  }

  httpGet() {
    return new Promise((resolve, reject) => {
      const request = https.get(this.url, (response) => {
        if (response.statusCode < 200 || response.statusCode > 299) {
          reject(new Error(`Failed to load page, status code: ${response.statusCode}`));
        }
        const body = [];
        response.on('data', chunk => body.push(chunk));
        response.on('end', () => resolve(body.join('')));
      });
      request.on('error', err => reject(err));
    });
  }
}

module.exports = WorldStateCache;
