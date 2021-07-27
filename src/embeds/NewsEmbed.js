'use strict';

const BaseEmbed = require('./BaseEmbed.js');

// eslint-disable-next-line no-unused-vars
const createGroupedArray = (arr, chunkSize) => {
  const groups = [];
  for (let i = 0; i < arr.length; i += chunkSize) {
    groups.push(arr.slice(i, i + chunkSize));
  }
  return groups;
};

/**
 * Generates news embeds
 */
class NewsEmbed extends BaseEmbed {
  /**
   * @param {Genesis} bot - An instance of Genesis
   * @param {Array.<News>} news - The news to be included in the embed
   * @param {string} type - [Optional] type of embed between news, updates,
   *                        or prime access. Not provided for news.
   * @param {string} platform - platform
   */
  constructor(bot, news, type, platform) {
    super();

    news.sort((a, b) => {
      const date1 = new Date(a.endDate || a.date);
      const date2 = new Date(b.endDate || b.date);

      return date2.getTime() - date1.getTime();
    });

    this.color = news.length > 0 ? 0x779ecb : 0xff6961;
    let value = createGroupedArray(news
      .filter(n => {
        if (type) {
          return (type === 'update' && n.update)
            || (type === 'primeaccess' && n.primeAccess)
            || (type === 'stream' && n.stream);
        }
        return true;
      })
      .map(n => {
        const etaChunks = n.eta.split(' ');
        const timeTokens = [
          etaChunks[0],
          etaChunks[1],
          etaChunks[1] !== etaChunks[etaChunks.length - 1]
            ? etaChunks[etaChunks.length - 1]
            : null
          ]
          .filter(a => !!a)
          .join(' ');
        const betterNews = `[${timeTokens}] [${n.message}](${n.link.split('?')[0]})`;
        return betterNews;
      }), 7);
    if (type) {
      if (type === 'update') {
        value = value.length > 0 ? value : ['No Update News Currently'];
      } else {
        value = value.length > 0 ? value : ['No Prime Access Currently'];
      }
    } else {
      value = value.length > 0 ? value : ['No News Currently'];
    }
    const first = news[0];
    if (news.length === 1) {
      this.title = `[${platform.toUpperCase()}] ${first.message}`;
      this.fields = undefined;
      this.footer.text = 'Published ';
      this.timestamp = new Date(first.date);
      this.url = first.link;
    } else {
      if (Array.isArray(value[0])) {
        this.fields = value.map(val => ({ name: '\u200B', value: val.join('\n') }));
      } else {
        [this.description] = value;
      }
      this.footer.text = platform.toUpperCase();
    }
    this.image = { url: first ? first.imageLink : '' };
  }
}

module.exports = NewsEmbed;
