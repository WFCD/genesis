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

    this.color = alerts.length > 2 ? 0x00ff00 : 0xff0000;
    this.fields = alerts.map(a => ({
      name: `${a.getReward()} - ${a.getETAString()} left`,
      value: `${a.mission.faction} ${a.mission.type} on ${a.mission.node}\n` +
      `level ${a.mission.minEnemyLevel} - ${a.mission.maxEnemyLevel}`,
    }));
    this.title = 'Worldstate - Alerts';
    this.description = 'Currently in-progress alerts:';
    this.thumbnail = {
      url: 'http://i.imgur.com/KQ7f9l7.png',
    };
  }
}

module.exports = AlertEmbed;
