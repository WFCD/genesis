'use strict';

const BaseEmbed = require('./BaseEmbed.js');

/**
 * Generates alert embeds
 */
class AlertEmbed extends BaseEmbed {
  /**
   * @param {Genesis} bot - An instance of Genesis
   * @param {Array.<Alert>} alerts - The alerts to be included in the embed
   * @param {string} platform - platform
   */
  constructor(bot, alerts, platform) {
    super();

    this.thumbnail = {
      url: 'http://i.imgur.com/KQ7f9l7.png',
    };
    this.color = 0xF1C40F;
    if (alerts.length > 1) {
      this.fields = alerts.map(a => ({
        name: `${a.mission.reward.asString} - ${a.eta} left`,
        value: `${a.mission.faction} ${a.mission.type} on ${a.mission.node}\n` +
        `level ${a.mission.minEnemyLevel} - ${a.mission.maxEnemyLevel}`,
      }));
      this.title = `[${platform.toUpperCase()}] Worldstate - Alerts`;
    } else {
      const a = alerts[0];
      this.title = `[${platform.toUpperCase()}] ${a.mission.reward.itemString}`;
      this.color = a.mission.reward.color;
      this.thumbnail.url = a.mission.reward.thumbnail;
      const summary = `${a.mission.faction} ${a.mission.type} on ${a.mission.node}`;
      this.description = a.description || summary;
      this.fields = [];
      if (this.description !== summary) {
        this.fields.push({ name: '_ _', value: `${a.mission.faction} ${a.mission.type} on ${a.mission.node}` });
      }
      this.fields.push({ name: 'Levels:', value: `${a.mission.minEnemyLevel} - ${a.mission.maxEnemyLevel}`, inline: true });
      this.fields.push({ name: 'Archwing Required', value: a.mission.archwingRequired ? 'Yes' : 'No', inline: true });

      if (this.title.indexOf('cr') === -1) {
        this.fields.push({ name: '_ _', value: `**Credits:** ${a.mission.reward.credits}cr`, inline: true });
      }
      this.footer.text = `${a.eta} remaining`;
    }
  }
}

module.exports = AlertEmbed;
