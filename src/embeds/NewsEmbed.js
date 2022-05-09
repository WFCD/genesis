import BaseEmbed from './BaseEmbed.js';

import { createGroupedArray } from '../utilities/CommonFunctions.js';

const newsSort = (a, b) => {
  const date1 = new Date(a.endDate || a.date);
  const date2 = new Date(b.endDate || b.date);

  return date2.getTime() - date1.getTime();
};

/**
 * Generates news embeds
 */
export default class NewsEmbed extends BaseEmbed {
  /**
   * @param {Array.<News> | News} news - The news to be included in the embed
   * @param {string} type - [Optional] type of embed between news, updates,
   *                        or prime access. Not provided for news.
   * @param {string} platform - platform
   * @param {string} locale locality of the translation
   * @param {I18n} i18n internationalizer
   */
  constructor(news, { type, platform, locale, i18n }) {
    super(locale);
    if (!Array.isArray(news)) news = [news];
    news.sort(newsSort);

    this.color = news.length > 0 ? 0x779ecb : 0xff6961;
    let value = createGroupedArray(
      news
        .filter((n) => {
          if (type) {
            return (
              (type === 'update' && n.update) ||
              (type === 'primeaccess' && n.primeAccess) ||
              (type === 'stream' && n.stream)
            );
          }
          return true;
        })
        .map((n) => {
          const etaChunks = n.eta.split(' ');
          const timeTokens = [
            etaChunks[0],
            etaChunks[1],
            etaChunks[1] !== etaChunks[etaChunks.length - 1] ? etaChunks[etaChunks.length - 1] : undefined,
          ]
            .filter((a) => !!a)
            .join(' ');
          return `[${timeTokens}] [${n.message}](${n.link.split('?')[0]})`;
        }),
      7
    );
    if (type) {
      if (type === 'update') {
        value = value.length > 0 ? value : [i18n`No Update News Currently`];
      } else {
        value = value.length > 0 ? value : [i18n`No Prime Access Currently`];
      }
    } else {
      value = value.length > 0 ? value : [i18n`No News Currently`];
    }
    const first = news[0];
    if (news.length === 1) {
      this.title = i18n`[${platform.toUpperCase()}] ${first.message}`;
      this.fields = undefined;
      this.footer.text = i18n`Published `;
      this.timestamp = new Date(first.date);
      this.url = first.link;
    } else {
      if (Array.isArray(value[0])) {
        this.fields = value.map((val) => ({ name: '\u200B', value: val.join('\n') }));
      } else {
        [this.description] = value;
      }
      this.footer.text = platform.toUpperCase();
    }
    this.image = { url: first ? first.imageLink : '' };
  }
}
