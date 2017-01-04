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
   */
  constructor(settings) {
    this.settings = settings;
  }

  /**
   * Get the localized string for a particular stringId
   * @param {string} stringId String id of the internationalized string to fetch
   * @param {Message} message Message to derive template replacement data from
   *                          as well as for fetching settings
   * @returns {Promise<string>} String promise with the corresponding string
   */
  getString(stringId, message, { command = '' } = {}) {
    return new Promise((resolve, reject) => {
      this.settings.getChannelLanguage(message.channel.id)
        .then((language) => {
          const lang = language !== null ? language : 'english';
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
            resolve(resStr);
          } else {
            reject(`Couldn't find string ${stringId}`);
          }
        })
        .catch(err => reject(err));
    });
  }
}

module.exports = StringManager;
