'use strict';

const BaseEmbed = require('./BaseEmbed.js');
const { assetBase, groupBy } = require('../CommonFunctions');

const kuvaThumb = `${assetBase}/img/kuva.png`;

/**
 * Generates Kuva mission embed embeds
 */
class KuvaEmbed extends BaseEmbed {
  /**
   * @param {Genesis} bot - An instance of Genesis
   * @param {Array.<Alert>} kuver - The kuva missions to be included in the embed
   * @param {string} platform - platform
   * @param {I18n} i18n - string template function for internationalization
   */
  constructor(bot, kuver, platform, i18n) {
    super();

    this.thumbnail = {
      url: kuvaThumb,
    };
    this.color = 0x742725;
    this.title = i18n`[${platform.toUpperCase()}] Worldstate - Kuva`;
    const grouped = groupBy(kuver, 'enemy');
    this.fields = [];
    Object.keys(grouped).forEach((enemy) => {
      this.fields.push({
        name: enemy,
        value: grouped[enemy].map(kuva => i18n`${kuva.type} on ${kuva.node}`)
          .join('\n'),
        inline: false,
      });
    });

    this.footer.text = 'Expires';
    this.timestamp = kuver[0].expiry;
  }
}

module.exports = KuvaEmbed;
