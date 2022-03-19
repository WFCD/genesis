'use strict';

const BaseEmbed = require('./BaseEmbed.js');
const { assetBase } = require('../CommonFunctions');

const alertThumb = `${assetBase}/img/alert.png`;

/**
 * Generates alert embeds
 */
class AlertEmbed extends BaseEmbed {
  /**
   * @param {Array.<Alert>} alerts - The alerts to be included in the embed
   * @param {string} platform - platform
   * @param {I18n} i18n - string template function for internationalization
   */
  constructor(alerts, { platform, i18n }) {
    super();

    this.thumbnail = {
      url: alertThumb,
    };
    this.color = 0xF1C40F;
    // compact
    if (alerts.length > 1) {
      this.fields = alerts.map(a => ({
        name: i18n`${a.mission.reward.asString} | ${a.eta} left`,
        value: i18n`${a.mission.faction} ${a.mission.type} on ${a.mission.node}\nlevel ${a.mission.minEnemyLevel} - ${a.mission.maxEnemyLevel}\n\u200B`,
      }));
      this.title = i18n`[${platform.toUpperCase()}] Worldstate - Alerts`;
    } else { // divided
      const a = alerts[0];
      this.title = i18n`[${platform.toUpperCase()}] ${a.mission.reward.itemString || i18n`${a.mission.reward.credits} Credits`}`;
      this.color = a.mission.reward.color;
      this.thumbnail.url = a.mission.reward.thumbnail;
      const summary = i18n`${a.mission.faction} ${a.mission.type} on ${a.mission.node}`;
      this.description = a.description;

      this.fields = [];
      if (this.description !== summary) {
        this.fields.push({ name: i18n`Mission`, value: i18n`${a.mission.faction} ${a.mission.type}`, inline: true });
        this.fields.push({ name: i18n`Location`, value: a.mission.node, inline: true });
      }
      this.fields.push({ name: 'Levels:', value: `${a.mission.minEnemyLevel} - ${a.mission.maxEnemyLevel}`, inline: true });

      this.fields.push({ name: i18n`Archwing Required`, value: a.mission.archwingRequired ? i18n`Yes` : i18n`No`, inline: true });

      if (this.title.indexOf('Cr') === -1) {
        this.fields.push({ name: '\u200B', value: i18n`**Credits:** ${a.mission.reward.credits}`, inline: true });
      }
      this.footer.text = i18n`${a.eta} remaining • Expires `;
      this.timestamp = a.expiry;
    }
  }
}

module.exports = AlertEmbed;
