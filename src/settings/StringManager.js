'use strict';

const strings = require('../resources/strings.json');

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
    this.settings = settings;
    this.logger = logger;
  }

  /**
   * Get the localized string for a particular stringId
   * @param {string} stringId String id of the internationalized string to fetch
   * @param {Message} message Message to derive template replacement data from
   *                          as well as for fetching settings
   * @returns {string} String promise with the corresponding string
   */
  async getString(stringId, message, { command = '' } = {}) {
    const language = this.settings.getChannelSetting(message.channel, 'language');
    const lang = language !== null ? language : 'en_US';
    let resStr = strings.languages[`${lang}`][`${stringId}`];
    if (typeof resStr !== 'undefined') {
      if (message !== null) {
        resStr = resStr.replace(/\$author/i, message.author.toString())
          .replace(/\$message/i, message.cleanContent)
          .replace(/\$channel/i, message.channel.name)
          .replace(/\$ch_mntn/i, message.channel.toString());
      }
      if (command !== '') {
        resStr = resStr.replace(/\$command/i, command);
      }
      return resStr;
    }
    this.logger.error(`Couldn't find string ${stringId}`);
    return '';
  }
}

module.exports = StringManager;
