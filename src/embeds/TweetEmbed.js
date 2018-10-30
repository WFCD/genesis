'use strict';

const BaseEmbed = require('./BaseEmbed.js');

/**
 * Generates sortie embeds
 */
class TweetEmbed extends BaseEmbed {
  /**
   * @param {Genesis} bot - An instance of Genesis
   * @param {tweet} tweet - A singular tweet object. Detailed info can be found at https://developer.twitter.com/en/docs/tweets/data-dictionary/overview/tweet-object.html
   */
  constructor(bot, tweet) {
    super();
    this.color = 33972;
    this.description = `${tweet.full_text}`;
    this.timestamp = `${tweet.created_at}`;
    this.url = `https://twitter.com/${tweet.user.screen_name}/status/${tweet.id_str}`;

    if (tweet.entities.media != null) {
      this.image = {
        url: `${tweet.entities.media[0].media_url}`,
      };
    }

    if (tweet.in_reply_to_status_id != null) {
      this.title = `${tweet.user.name} replied to a Tweet`;
    } else if (tweet.quoted_status_id != null) {
      this.title = `${tweet.user.name} retweeted a Tweet from ${tweet.quoted_status.user.name} (@${tweet.quoted_status.user.screen_name})`;
      this.fields.push({
        name: `${tweet.quoted_status.user.name}`,
        value: `${tweet.quoted_status.full_text}`,
      });
    } else if (tweet.retweeted_status != null) {
      this.title = `${tweet.user.name} retweeted a Tweet from ${tweet.retweeted_status.user.name} (@${tweet.retweeted_status.user.screen_name})`;
      this.description = `${tweet.retweeted_status.full_text}`;
    } else {
      this.title = `${tweet.user.name} Tweeted`;
    }

    this.footer = {
      text: `From @${tweet.user.screen_name}`,
      icon_url: 'https://i.imgur.com/CwIRKhh.png',
    };

    this.author = {
      name: `${tweet.user.screen_name}`,
      icon_url: `${tweet.user.profile_image_url.replace('_normal.jpg', '.jpg')}`,
      url: `https://twitter.com/${tweet.user.screen_name}`,
    };
  }
}

module.exports = TweetEmbed;
