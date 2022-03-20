'use strict';

const BaseEmbed = require('./BaseEmbed.js');

class ConstructionEmbed extends BaseEmbed {
  constructor(constructionProgress, { platform, i18n, locale }) {
    super(locale);

    this.color = 0xff6961;
    this.fields = [{
      name: i18n`[${platform.toUpperCase()}] Construction Status:`,
      value: i18n`\`Razorback: ${constructionProgress.razorbackProgress}\`
\`Fomorian:  ${constructionProgress.fomorianProgress}\`
\`Unknown:   ${constructionProgress.unknownProgress}\``,
    }];
  }
}

module.exports = ConstructionEmbed;
