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
    this.description = tweet.text;
    this.timestamp = new Date(tweet.createdAt);
    this.url = tweet.url;

    if (tweet.mediaUrl) {
      this.image = {
        url: `${tweet.mediaUrl}`,
      };
    }

    if (tweet.isReply) {
      this.title = `${tweet.author.name} replied to a Tweet`;
    } else if (tweet.quote) {
      this.title = `${tweet.author.name} retweeted a Tweet from ${tweet.quote.author.name} (@${tweet.quote.author.handle})`;
      this.fields.push({
        name: `${tweet.quote.author.name}`,
        value: tweet.quote.text,
      });
    } else if (tweet.retweet) {
      this.title = `${tweet.user.name} retweeted a Tweet from ${tweet.retweet.author.name} (@${tweet.retweet.author.handle})`;
      this.description = `${tweet.retweet.text}`;
    } else {
      this.title = `${tweet.user.name} Tweeted`;
    }

    this.footer = {
      text: `From @${tweet.author.handle}`,
      icon_url: 'https://i.imgur.com/CwIRKhh.png',
    };

    this.author = {
      name: tweet.author.handle,
      icon_url: tweet.author.avatar,
      url: tweet.author.url,
    };
  }
}

module.exports = TweetEmbed;
