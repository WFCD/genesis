import EventEmitter from 'events';
import cron from 'cron';

import fetch from './Fetcher.js';
import logger from './Logger.js';
import { apiBase } from './CommonFunctions.js';

const Job = cron.CronJob;

const ws = (platform, locale) => `${apiBase}/${platform}/?languages=${locale}`;

export default class WorldStateCache extends EventEmitter {
  constructor(platform, locale, timeout) {
    super();
    this.url = ws(platform, locale);
    this.timeout = timeout;
    this.currentData = undefined;
    this.lastUpdated = undefined;
    this.updating = undefined;
    this.platform = platform;
    this.locale = locale;

    const to = Math.round(timeout / 60000) < 1 ? 1 : Math.round(timeout / 60000);
    this.updateJob = new Job(`0 */${to} * * * *`, this.update.bind(this), undefined, true);
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
}
