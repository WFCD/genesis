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
    this.description =`${tweet.text}`;
    this.timestamp = `${tweet.created_at}`;
    this.url = `https://twitter.com/${tweet.user.screen_name}/status/${tweet.id_str}`;

    if(tweet.entities.hasOwnProperty('media')) {
      this.image = {
        url: `${tweet.entities.media[0].media_url}`
      }
    };

    if(tweet.in_reply_to_status_id != null) {
      this.title = `${tweet.user.name} replied to a Tweet`;
    } else if (tweet.quoted_status_id != null) {
      this.title = `${tweet.user.name} quote-retweeted a Tweet`;
    } else if(tweet.retweeted_status != null) {
      this.title = `${tweet.user.name} retweeted a Tweet from ${tweet.retweeted_status.user.name} (@${tweet.retweeted_status.user.screen_name})`;
    } else {
      this.title = `${tweet.user.name} Tweeted`;
    };

    this.footer = {
      text: `From @${tweet.user.screen_name}`,
      icon_url: 'https://i.imgur.com/CwIRKhh.png'
    };

    this.author = {
      name: `${tweet.user.screen_name}`,
      icon_url: `${tweet.user.profile_image_url.replace('_normal.jpg', '.jpg')}`,
      url: `https://twitter.com/${tweet.user.screen_name}`
    };
  }
}

module.exports = TweetEmbed;
