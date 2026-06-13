import { captures, createGroupedArray } from '#shared/utilities/CommonFunctions';
import { eta } from '#shared/utilities/WorldState';

import BaseEmbed from './BaseEmbed';
import type { EmbedBuildOptions } from './embedOptions';

const updtReg = new RegExp(captures.updates, 'i');

const newsSort = (a, b) => {
  const date1 = new Date(a.endDate || a.date);
  const date2 = new Date(b.endDate || b.date);

  return date2.getTime() - date1.getTime();
};

const normalizeNewsType = (raw?: string) => {
  if (!raw || raw === 'news' || raw === 'all') return undefined;
  if (raw === 'updates') return 'update';
  if (raw === 'streams') return 'stream';
  return raw;
};

const matchesNewsType = (item, type?: string) => {
  if (!type) return true;
  if (type === 'update') return item.update || updtReg.test(item.message);
  if (type === 'primeaccess') return item.primeAccess;
  if (type === 'stream') return item.stream;
  return true;
};

const isInfiniteTime = (time: string) => !time || time.includes('\u221E') || /infinity/i.test(time);

const newsTimePrefix = (item: { expiry?: string; endDate?: string; activation?: string }) => {
  const timed =
    item.expiry || item.endDate ? { expiry: item.expiry ?? item.endDate, activation: item.activation } : item;
  const etaText = eta(timed);
  if (isInfiniteTime(etaText)) return '';

  const etaChunks = etaText.split(' ').filter(Boolean);
  if (!etaChunks.length) return '';

  const timeTokens = [
    etaChunks[0],
    etaChunks[1],
    etaChunks[1] !== etaChunks[etaChunks.length - 1] ? etaChunks[etaChunks.length - 1] : undefined,
  ]
    .filter(Boolean)
    .join(' ');

  if (isInfiniteTime(timeTokens)) return '';

  return `[${timeTokens}] `;
};

const formatNewsLine = (item: {
  message: string;
  link: string;
  expiry?: string;
  endDate?: string;
  activation?: string;
}) => `${newsTimePrefix(item)}[${item.message}](${item.link.split('?')[0]})`;

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
  constructor(news, { type, category, platform, locale, i18n }: EmbedBuildOptions) {
    super(locale);
    if (!Array.isArray(news)) news = [news];
    news.sort(newsSort);
    const newsType = normalizeNewsType((type ?? category) as string | undefined);
    const filtered = news.filter((n) => matchesNewsType(n, newsType));

    this.color = filtered.length > 0 ? 0x779ecb : 0xff6961;
    let value = createGroupedArray(
      filtered.map((n) => formatNewsLine(n)),
      7
    );
    if (newsType) {
      if (newsType === 'update') {
        value = value.length > 0 ? value : [i18n`No Update News Currently`];
      } else if (newsType === 'stream') {
        value = value.length > 0 ? value : [i18n`No Streams Currently`];
      } else {
        value = value.length > 0 ? value : [i18n`No Prime Access Currently`];
      }
    } else {
      value = value.length > 0 ? value : [i18n`No News Currently`];
    }
    const first = filtered[0];
    if (filtered.length === 1) {
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
    this.image = { url: first?.imageLink ?? '' };
  }
}
