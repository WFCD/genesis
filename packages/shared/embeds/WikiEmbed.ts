import type { WikiLookupResult } from '#shared/utilities/WarframeWikiClient';

import BaseEmbed from './BaseEmbed';

const DESCRIPTION_LIMIT = 3900;

export default class WikiEmbed extends BaseEmbed {
  constructor(result: WikiLookupResult) {
    super();
    this.color = 0x008fd6;

    if (result.page) {
      const { page } = result;
      this.title = page.title;
      this.url = page.url;
      this.description =
        page.extract.length > DESCRIPTION_LIMIT
          ? `${page.extract.slice(0, DESCRIPTION_LIMIT - 1)}…`
          : page.extract || '_No summary available on the wiki._';
      if (page.thumbnail) {
        this.thumbnail = { url: page.thumbnail };
      }
    } else {
      this.title = 'No wiki page found';
      this.description = `No direct match for **${result.query || 'that query'}** on the official Warframe Wiki.`;
    }

    const hitLabel =
      result.totalHits > 0
        ? `${result.totalHits.toLocaleString()} result${result.totalHits === 1 ? '' : 's'}`
        : 'No results';
    this.addFields({
      name: result.page ? 'Open page' : 'Search the wiki',
      value: result.page
        ? `[${result.page.title}](${result.page.url})`
        : `[Browse results for "${result.query}"](${result.searchUrl})`,
    });
    this.addFields({
      name: 'All search results',
      value: `[Open wiki search](${result.searchUrl}) • ${hitLabel}`,
    });
    this.footer = { text: 'Official Warframe Wiki' };
  }
}
