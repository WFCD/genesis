'use strict';

const http = require('http');

const WorldState = require('warframe-worldstate-parser');
const EventEmitter = require('events');

const worldStateURLs = {
  pc: 'http://content.warframe.com/dynamic/worldState.php',
  ps4: 'http://content.ps4.warframe.com/dynamic/worldState.php',
  xb1: 'http://content.xb1.warframe.com/dynamic/worldState.php',
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
      this.currentData = new WorldState(data);
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
      const request = http.get(this.url, (response) => {
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
