'use strict';

const BaseEmbed = require('./BaseEmbed.js');

/**
 * Generates alert embeds
 */
class AlertEmbed extends BaseEmbed {
  /**
   * @param {Genesis} bot - An instance of Genesis
   * @param {Array.<Alert>} alerts - The alerts to be included in the embed
   */
  constructor(bot, alerts) {
    super(bot);

    if (alerts.length > 1) {
      this.color = alerts.length > 2 ? 0x00ff00 : 0xff0000;
      this.fields = alerts.map(a => ({
        name: `${a.getReward().toString().replace(/^1\s/, '')} - ${a.getETAString()} left`,
        value: `${a.mission.faction} ${a.mission.type} on ${a.mission.node}\n` +
        `level ${a.mission.minEnemyLevel} - ${a.mission.maxEnemyLevel}`,
      }));
      this.title = 'Worldstate - Alerts';
      this.description = 'Currently in-progress alerts:';
    } else {
      const a = alerts[0];
      this.title = a.getReward().toString().replace(/\s*\+\s*\d*cr/ig, '').replace(/^1\s/, '');
      this.color = 0x00ff00;
      this.description = a.getDescription() && a.getDescription() !== '' ? a.getDescription() : '　';
      this.fields = [
        { name: 'Time Remaining', value: a.getETAString(), inline: true },
        { name: 'Credits', value: `${a.getReward().credits}cr`, inline: true },
        { name: 'Mission', value: `${a.mission.faction} ${a.mission.type}`, inline: true },
        { name: 'Location', value: a.mission.node, inline: true },
        { name: 'Levels', value: `${a.mission.minEnemyLevel} - ${a.mission.maxEnemyLevel}`, inline: true },
      ];
    }
    this.thumbnail = {
      url: 'http://i.imgur.com/KQ7f9l7.png',
    };
  }
}

module.exports = AlertEmbed;
