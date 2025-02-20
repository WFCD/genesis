import { assetBase } from '../utilities/CommonFunctions.js';

import BaseEmbed from './BaseEmbed.js';

const alertThumb = `${assetBase}/img/alert.png`;

export default class AlertEmbed extends BaseEmbed {
  /**
   * Create an embed from an array, or single, alert
   * @param {WorldState.Alert | WorldState.Alert[]} alerts alert to be displayed
   * @param {string} platform platform of the worldstate
   * @param {I18n} i18n translator
   * @param {string} locale locale of the worldstate
   */
  constructor(alerts, { platform, i18n, locale }) {
    super(locale);

    this.setThumbnail(alertThumb);
    this.setColor(0xf1c40f);
    // compact
    if (Array.isArray(alerts) && alerts.length > 1) {
      this.setFields(
        alerts.map((a) => ({
          name: i18n`${a.mission.reward.asString} | ${a.eta} left`,
          value: i18n`${a.mission.faction} ${a.mission.type} on ${a.mission.node}\nlevel ${a.mission.minEnemyLevel} - ${a.mission.maxEnemyLevel}\n\u200B`,
        }))
      );
      this.setTitle(i18n`[${platform.toUpperCase()}] Worldstate - Alerts`);
    } else {
      // divided
      const a = Array.isArray(alerts) ? alerts[0] : alerts;
      this.setTitle(
        i18n`[${platform.toUpperCase()}] ${a.mission.reward.itemString || i18n`${a.mission.reward.credits} Credits`}`
      );
      this.setColor(a.mission.reward.color);
      this.setThumbnail(a.mission.reward.thumbnail);
      const summary = i18n`${a.mission.faction} ${a.mission.type} on ${a.mission.node}`;
      this.setDescription(a.description);

      this.setFields([]);
      if (this.description !== summary) {
        this.addFields([{ name: i18n`Mission`, value: i18n`${a.mission.faction} ${a.mission.type}`, inline: true }]);
        this.addFields([{ name: i18n`Location`, value: a.mission.node, inline: true }]);
      }
      this.addFields({
        name: 'Levels:',
        value: `${a.mission.minEnemyLevel} - ${a.mission.maxEnemyLevel}`,
        inline: true,
      });

      this.addFields({
        name: i18n`Archwing Required`,
        value: a.mission.archwingRequired ? i18n`Yes` : i18n`No`,
        inline: true,
      });

      if (this.data.title.indexOf('Cr') === -1) {
        this.addFields({ name: '\u200B', value: i18n`**Credits:** ${a.mission.reward.credits}`, inline: true });
      }
      this.setFooter({ text: i18n`${a.eta} remaining • Expires ` });
      this.setTimestamp(a.expiry);
    }
  }
}
