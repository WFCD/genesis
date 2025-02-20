import BaseEmbed from './BaseEmbed.js';

export default class TweetEmbed extends BaseEmbed {
  constructor(tweet, { i18n, locale }) {
    super(locale);
    this.setColor(33972);
    this.setDescription(tweet.text);
    this.setTimestamp(new Date(tweet.createdAt));
    this.setURL(tweet.url);

    if (tweet.mediaUrl) {
      this.setImage(`${tweet.mediaUrl}`);
    }

    if (tweet.isReply) {
      this.setTitle(i18n`${tweet.author.name} replied to a Tweet`);
    } else if (tweet.quote) {
      this.setTitle(
        i18n`${tweet.author.name} retweeted a Tweet from ${tweet.quote.author.name} (@${tweet.quote.author.handle})`
      );
      this.addFields({
        name: `${tweet.quote.author.name}`,
        value: tweet.quote.text,
      });
    } else if (tweet.retweet) {
      this.setTitle(
        i18n`${tweet.author.name} retweeted a Tweet from ${tweet.retweet.author.name} (@${tweet.retweet.author.handle})`
      );
      this.setDescription(tweet.retweet.text);
    } else {
      this.setTitle(i18n`${tweet.author.name} Tweeted`);
    }

    this.setFooter({
      text: i18n`From @${tweet.author.handle}`,
      icon_url: 'https://i.imgur.com/CwIRKhh.png',
    });

    this.setAuthor({
      name: tweet.author.handle,
      icon_url: tweet.author.avatar,
      url: tweet.author.url,
    });
  }
}
