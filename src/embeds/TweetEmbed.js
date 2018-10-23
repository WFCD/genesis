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
    this.color = 33972;
    this.description = `${tweet.tweets[0].text}`;
    this.footer = {
      text: `${tweet.tweets[0].user.name} - ${tweet.tweets[0].user.url}`,
      icon_url: 'https://i.imgur.com/CwIRKhh.png'
    };

    console.log(`${tweet.tweets[0].user.profile_image_url}`);
    this.title = `${tweet.tweets[0].user.name} (@${tweet.tweets[0].user.screen_name}) Tweeted`;
    this.thumbnail = {
      url: `${tweet.tweets[0].user.profile_image_url.replace('_normal.jpg', '.jpg')}`
    };
  }
}

module.exports = TweetEmbed;
