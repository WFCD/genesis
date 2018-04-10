'use strict';

const BaseEmbed = require('./BaseEmbed.js');

/**
 * A collection of configurables for a log
 * @typedef {Object.<string>} Log
 * @property {int} color             - Log Embed color
 * @property {string} title          - Log Embed Title
 * @property {Array.<Object>} fields - Field objects
 * @property {string} footer         - String for the footer
 */

/**
 * Generates LFG embeds
 */
class LogEmbed extends BaseEmbed {
  /**
   * @param {Genesis} bot - An instance of Genesis
   * @param {Log} log - LFG Options
   */
  constructor(bot, log) {
    super();
    this.color = log.color;
    this.title = log.title;
    this.fields = log.fields;
    this.footer.text = log.footer;
  }
}

module.exports = LogEmbed;
