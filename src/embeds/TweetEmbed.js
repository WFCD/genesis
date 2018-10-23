'use strict';

const BaseEmbed = require('./BaseEmbed.js');

/**
 * Generates sortie embeds
 */
class TweetEmbed extends BaseEmbed {
  /**
   * @param {Genesis} bot - An instance of Genesis
   * @param {Sortie} sortie - The sortie to be included in the embed
   * @param {string} platform - platform
   */
  constructor(bot, tweet, platform) {
    super();
    this.color = 0xa84300;
    this.description = `${tweet.tweets[0].text}`;
    this.footer.text = `${tweet.tweets[0].user.name}`;
  

    this.title = `New Tweet From ${tweet.tweets[0].user.name}`;
    this.thumbnail = {
      url: 'http://i.imgur.com/wWBRhaB.png',
    };
  }
}

module.exports = TweetEmbed;
