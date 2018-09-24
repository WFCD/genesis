'use strict';

const https = require('https');
const http = require('http');

const EventEmitter = require('events');
const { apiBase } = require('./CommonFunctions.js');


const worldStateURLs = {
  pc: `${apiBase}/pc`,
  ps4: `${apiBase}/ps4`,
  xb1: `${apiBase}/xb1`,
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
      delete this.currentData;
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
      const protocol = this.url.startsWith('https') ? https : http;
      const request = protocol.get(this.url, (response) => {
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
