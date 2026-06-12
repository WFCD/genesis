import { itemImageUrl } from '#shared/utilities/CommonFunctions';

import BaseEmbed from './BaseEmbed';
import type { EmbedBuildOptions } from './embedOptions';

const sentientThumb = itemImageUrl('SentientFactionIcon.png');

export default class SentientOutpostEmbed extends BaseEmbed {
  constructor(outpost, { i18n, locale }: EmbedBuildOptions) {
    super(locale);
    this.setTitle(i18n`Sentient Outpost`);
    this.setThumbnail(sentientThumb);
    this.setDescription(outpost.mission.node);
    this.setFooter({ text: i18n`Fades at` });
    this.timestamp = outpost.expiry;
  }
}
