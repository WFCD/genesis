'use strict';

const EventEmitter = require('events');
const { apiBase } = require('./CommonFunctions.js');
const fetch = require('./resources/Fetcher');

const logger = require('./Logger');

const worldStateURLs = {
  pc: `${apiBase}/pc`,
  ps4: `${apiBase}/ps4`,
  xb1: `${apiBase}/xb1`,
  swi: `${apiBase}/swi`,
};

module.exports = class WorldStateCache extends EventEmitter {
  constructor(platform, timeout) {
    super();
    this.url = worldStateURLs[platform];
    this.timeout = timeout;
    this.currentData = undefined;
    this.lastUpdated = undefined;
    this.updating = undefined;
    this.platform = platform;
    this.updateInterval = setInterval(() => this.update(), timeout);
    this.update();
  }

  async getData() {
    if (this.updating) {
      return this.updating;
    }
    return this.currentData;
  }

  async update() {
    try {
      this.lastUpdated = Date.now();
      this.currentData = await fetch(this.url);
      this.updating = undefined;
      this.emit('newData', this.platform, this.currentData);
      return this.currentData;
    } catch (err) {
      this.updating = undefined;
      logger.debug(err);
    }
    return this.updating;
  }
};
