import BaseEmbed from './BaseEmbed.js';

/**
 * A collection of configurables for a log
 * @typedef {Object.<string>} Log
 * @property {int} color             - Log Embed color
 * @property {string} title          - Log Embed Title
 * @property {Array.<Object>} fields - Field objects
 * @property {string} footer         - String for the footer
 */

export default class LogEmbed extends BaseEmbed {
  /**
   * @param {Log} log - LFG Options
   */
  constructor(log) {
    super();
    this.setColor(log.color);
    this.setTitle(log.title);
    this.setFields(log.footer);
    this.setFooter({ text: log.footer });
  }
}
