import type {
  OverframeBuildDetail,
  OverframeBuildSummary,
  OverframeSearchResult,
} from '#shared/utilities/OverframeClient';
import { resolveOverframeBrowseUrl } from '#shared/utilities/OverframeClient';

import BaseEmbed from './BaseEmbed';

const DESCRIPTION_LIMIT = 3800;

const trimDescription = (text: string) => {
  const cleaned = text.replace(/\[\[ youtube id="([^"]+)" \]\]/g, '[YouTube video](https://youtu.be/$1)').trim();
  if (cleaned.length <= DESCRIPTION_LIMIT) return cleaned || '_No guide text._';
  return `${cleaned.slice(0, DESCRIPTION_LIMIT - 1)}…`;
};

export class OverframeSearchEmbed extends BaseEmbed {
  constructor(result: OverframeSearchResult) {
    super();
    this.color = 0x7b68ee;
    this.title = 'Overframe build search';
    const totalPages = Math.max(1, Math.ceil(result.count / result.limit));
    const pageNumber = Math.floor(result.offset / result.limit) + 1;
    this.description = [
      `**Query:** ${result.query}`,
      result.itemId ? `**Item filter:** \`#${result.itemId}\`` : undefined,
      `**Results:** ${result.count.toLocaleString()} • **Page:** ${pageNumber}/${totalPages}`,
      `[Browse builds on Overframe](${result.searchUrl})`,
    ]
      .filter(Boolean)
      .join('\n');
    this.footer = { text: 'Select a build below, or browse more on Overframe' };
  }
}

export class OverframeBuildEmbed extends BaseEmbed {
  constructor(build: OverframeBuildDetail | OverframeBuildSummary, { query }: { query?: string } = {}) {
    super();
    this.color = 0x7b68ee;
    this.title = build.title;
    this.url = build.url;

    if ('description' in build && build.description) {
      this.description = trimDescription(build.description);
    } else {
      this.description = `_No guide preview — open the build on Overframe for the full page._`;
    }

    this.addFields(
      { name: 'Score', value: build.score.toLocaleString(), inline: true },
      { name: 'Author', value: build.author, inline: true },
      { name: 'Formas', value: String(build.formas), inline: true }
    );

    if ('modSlots' in build) {
      this.addFields(
        { name: 'Mods', value: String(build.modSlots), inline: true },
        { name: 'Comments', value: String(build.commentCount), inline: true },
        { name: 'Guide words', value: String(build.guideWordcount), inline: true }
      );
    }

    this.addFields({
      name: 'Open build',
      value: `[View on Overframe](${build.url})`,
    });

    if (query) {
      this.addFields({
        name: 'More builds',
        value: `[Browse on Overframe](${resolveOverframeBrowseUrl(query, { itemId: build.itemId, results: [build] })})`,
      });
    }

    this.footer = { text: `Overframe build #${build.id}` };
  }
}
