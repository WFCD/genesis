import BaseEmbed from './BaseEmbed.js';

export default class ConstructionEmbed extends BaseEmbed {
  constructor(constructionProgress, { platform, i18n, locale }) {
    super(locale);

    this.setColor(0xff6961);
    this.setFields([
      {
        name: i18n`[${platform.toUpperCase()}] Construction Status:`,
        value: i18n`\`Razorback: ${constructionProgress.razorbackProgress}\`
\`Fomorian:  ${constructionProgress.fomorianProgress}\`
\`Unknown:   ${constructionProgress.unknownProgress}\``,
      },
    ]);
  }
}
