'use strict';

const { timeDeltaToString, createGroupedArray } = require('../CommonFunctions');

const chString = challenge => `:white_small_square: **${challenge.title}** _(${challenge.reputation})_\n\u2003\t❯ ${challenge.desc}`;
const chStringSingle = challenge => `**${challenge.title}** _(${challenge.reputation})_\n\u2003❯ ${challenge.desc}`;

/**
 * Generates alert embeds
 */
module.exports = class NightwaveEmbed extends require('./BaseEmbed.js') {
  /**
   * @param {Genesis} bot - An instance of Genesis
   * @param {Nightwave} nightwave - The nightwave data for the current season
   * @param {string} platform - platform
   * @param {I18n} i18n - string template function for internationalization
   */
  constructor(bot, nightwave, platform, i18n) {
    super(bot);

    this.thumbnail = {
      url: 'https://i.imgur.com/yVcWOPp.png',
    };
    this.color = 0x663333;
    this.title = i18n`[${platform.toUpperCase()}] Worldstate - Nightwave`;

    const logicalSeason = nightwave.season + 1;
    const seasonDisplay = `${Math.floor(logicalSeason / 2)}${logicalSeason % 2 === 1 ? ' Intermission' : ''}`;

    if (nightwave.activeChallenges.length > 1) {
      this.description = i18n`Season ${seasonDisplay} • Phase ${nightwave.phase + 1}`;
      this.fields = [];
      this.fields.push({
        name: i18n`Currently Active`,
        value: String(nightwave.activeChallenges.length),
        inline: false,
      });

      if (nightwave.activeChallenges.filter(challenge => challenge.isDaily).length) {
        this.fields.push({
          name: i18n`Daily`,
          value: nightwave.activeChallenges
            .filter(challenge => challenge.isDaily)
            .map(chString)
            .join('\n') || '__',
          inline: false,
        });
      }

      createGroupedArray(nightwave.activeChallenges
        .filter(challenge => !challenge.isDaily && !challenge.isElite), 5)
        .forEach((challengeGroup, index) => {
          this.fields.push({
            name: index > 0 ? i18n`Weekly, ctd.` : i18n`Weekly`,
            value: challengeGroup
              .map(chString)
              .join('\n') || '__',
            inline: false,
          });
        });

      createGroupedArray(nightwave.activeChallenges
        .filter(challenge => !challenge.isDaily && challenge.isElite), 4)
        .forEach((challengeGroup, index) => {
          this.fields.push({
            name: index > 0 ? i18n`Elite Weekly, ctd.` : i18n`Elite Weekly`,
            value: challengeGroup
              .map(chString)
              .join('\n') || '__',
            inline: false,
          });
        });

      this.footer.text = `${timeDeltaToString(new Date(nightwave.expiry).getTime() - Date.now())} remaining • Expires `;
      this.timestamp = nightwave.activeChallenges[0].expiry;
    } else {
      const challenge = nightwave.activeChallenges[0];
      this.description = chStringSingle(challenge);
      if (challenge.isElite) {
        this.title = i18n`[${platform.toUpperCase()}] Worldstate - Elite Nightwave`;
      }
      this.footer.text = `${timeDeltaToString(new Date(challenge.expiry).getTime() - Date.now())} remaining • Expires `;
      this.timestamp = challenge.expiry;
    }
  }
};
