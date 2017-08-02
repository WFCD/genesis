'use strict';

const https = require('https');

const EventEmitter = require('events');

const worldStateURLs = {
  pc: 'https://ws.warframestat.us/pc',
  ps4: 'https://ws.warframestat.us/ps4',
  xb1: 'https://ws.warframestat.us/xb1',
};

class WorldStateCache extends EventEmitter {
  constructor(platform, timeout) {
    super();
    this.url = worldStateURLs[platform];
    this.timeout = timeout;
    this.currentData = null;
    this.lastUpdated = null;
    this.updating = null;
    this.platform = platform;
    this.updateInterval = setInterval(() => this.update(), timeout);
    this.update();
  }

  getData() {
    if (this.updating) {
      return this.updating;
    }
    return Promise.resolve(this.currentData);
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
      throw err;
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
