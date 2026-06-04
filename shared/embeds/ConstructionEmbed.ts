import BaseEmbed from './BaseEmbed';
import type { EmbedBuildOptions } from './embedOptions';

export default class ConstructionEmbed extends BaseEmbed {
  constructor(constructionProgress, { platform, i18n, locale }: EmbedBuildOptions) {
    super(locale);

    this.color = 0xff6961;
    this.fields = [
      {
        name: i18n`[${platform.toUpperCase()}] Construction Status:`,
        value: i18n`\`Razorback: ${constructionProgress.razorbackProgress}\`
\`Fomorian:  ${constructionProgress.fomorianProgress}\`
\`Unknown:   ${constructionProgress.unknownProgress}\``,
      },
    ];
  }
}
