'use strict';

const BaseEmbed = require('./BaseEmbed.js');
const { timeDeltaToString } = require('../CommonFunctions');

const chString = challenge => `:white_small_square: **${challenge.title}** _(${challenge.reputation})_\n\u2003\t❯ ${challenge.desc}`;
const chStringSingle = challenge => `**${challenge.title}** _(${challenge.reputation})_\n\u2003❯ ${challenge.desc}`;

/**
 * Generates alert embeds
 */
class NightwaveEmbed extends BaseEmbed {
  /**
   * @param {Genesis} bot - An instance of Genesis
   * @param {Nightwave} nightwave - The nightwave data for the current season
   * @param {string} platform - platform
   * @param {I18n} i18n - string template function for internationalization
   */
  constructor(bot, nightwave, platform, i18n) {
    super();

    this.thumbnail = {
      url: 'https://i.imgur.com/yVcWOPp.png',
    };
    this.color = 0x663333;
    this.title = i18n`[${platform.toUpperCase()}] Worldstate - Nightwave`;
    if (nightwave.activeChallenges.length > 1) {
      this.description = i18n`Season ${nightwave.season + 1} • Phase ${nightwave.phase + 1}`;
      this.fields = [];
      this.fields.push({
        name: i18n`Currently Active`,
        value: nightwave.activeChallenges.length,
        inline: false,
      });

      this.fields.push({
        name: i18n`Daily`,
        value: nightwave.activeChallenges
          .filter(challenge => challenge.isDaily)
          .map(chString)
          .join('\n'),
        inline: true,
      });

      this.fields.push({
        name: i18n`Weekly`,
        value: nightwave.activeChallenges
          .filter(challenge => !challenge.isDaily)
          .map(chString)
          .join('\n'),
        inline: true,
      });

      this.footer.text = `${timeDeltaToString(new Date(nightwave.expiry).getTime() - Date.now())} remaining • Expires `;
      this.timestamp = nightwave.expiry;
    } else {
      const challenge = nightwave.activeChallenges[0];
      this.description = chStringSingle(challenge);
      this.footer.text = `${timeDeltaToString(new Date(challenge).getTime() - Date.now())} remaining • Expires `;
      this.timestamp = challenge.expiry;
    }
  }
}

module.exports = NightwaveEmbed;
