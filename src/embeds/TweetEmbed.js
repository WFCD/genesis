import BaseEmbed from './BaseEmbed.js';

export default class TweetEmbed extends BaseEmbed {
  constructor(tweet, { i18n, locale }) {
    super(locale);
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
      this.title = i18n`${tweet.author.name} replied to a Tweet`;
    } else if (tweet.quote) {
      this.title = i18n`${tweet.author.name} retweeted a Tweet from ${tweet.quote.author.name} (@${tweet.quote.author.handle})`;
      this.fields.push({
        name: `${tweet.quote.author.name}`,
        value: tweet.quote.text,
      });
    } else if (tweet.retweet) {
      this.title = i18n`${tweet.author.name} retweeted a Tweet from ${tweet.retweet.author.name} (@${tweet.retweet.author.handle})`;
      this.description = tweet.retweet.text;
    } else {
      this.title = i18n`${tweet.author.name} Tweeted`;
    }

    this.footer = {
      text: i18n`From @${tweet.author.handle}`,
      icon_url: 'https://i.imgur.com/CwIRKhh.png',
    };

    this.author = {
      name: tweet.author.handle,
      icon_url: tweet.author.avatar,
      url: tweet.author.url,
    };
  }
}
