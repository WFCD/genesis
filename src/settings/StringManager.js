'use strict';

const fs = require('fs');
const path = require('path');


class StringManager {
  /**
   * Construct a string manager for internationalizing strings
   * String template:
   *  * `$author` - Replaced by the message author
   *  * `$message` - Replaced by the message content
   *  * `$channel` - Replaced by the message channel name
   *  * `$ch_mntn` - Replaced by the message channel mention
   *
   * @param {Settings} settings Settings for this string manager
   *                            to fetch the language for a channel with
   * @param {Logger} logger something to log with
   */
  constructor(settings, logger = console) {
    try {
      this.settings = settings;
      this.logger = logger;
      this.strings = {};
      this.logger.debug('Building strings...');
      const stringsDir = path.join(__dirname, '../l10n');
      const files = fs.readdirSync(stringsDir).filter(f => f.indexOf('.json') > -1);
      if (files) {
        files.forEach((file) => {
          if (file) {
            logger.debug(file);
            // eslint-disable-next-line import/no-dynamic-require, global-require
            this.strings[file.replace(/\.json/ig, '')] = require(path.join(stringsDir, file));
          }
        });
        this.logger.debug(`Files set: ${Object.keys(this.strings).length}`);
        this.logger.debug(`Build strings for languages: ${Object.keys(this.strings)
          .map(language => `${language}: ${Object.keys(this.strings[language]).length} `).join(', ')}`);
      }
    } catch (e) {
      logger.error(e);
    }
  }

  /**
   * Get the localized string for a particular stringId
   * @param {string} stringId String id of the internationalized string to fetch
   * @param {Message} message Message to derive template replacement data from
   *                          as well as for fetching settings
   * @returns {string} String promise with the corresponding string
   */
  getString(stringId, message, { command = '', replacements = undefined, language = 'en' } = {}) {
    try {
      let resStr = this.strings[`${language}`][`${stringId}`] || stringId;
      if (typeof resStr !== 'undefined') {
        if (typeof message !== 'undefined') {
          resStr = resStr.replace(/\$author/i, message.author.toString())
            .replace(/\$message/i, message.cleanContent)
            .replace(/\$channel/i, message.channel.name)
            .replace(/\$ch_mntn/i, message.channel.toString());
        }
        if (replacements) {
          Object.keys(replacements).forEach((replacement) => {
            resStr = resStr.replace(new RegExp(`\\$${replacement}`, 'ig'), replacements[`${replacement}`]);
          });
        }
        if (typeof command !== 'undefined' && command !== '') {
          resStr = resStr.replace(/\$command/i, command);
        }
        return resStr;
      }
      this.logger.error(`Couldn't find string ${stringId}`);
      return '';
    } catch (e) {
      this.logger.error(e);
    }
    return '';
  }
}

module.exports = StringManager;
