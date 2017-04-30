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
    super();

    this.thumbnail = {
      url: 'http://i.imgur.com/KQ7f9l7.png',
    };
    this.color = 0xF1C40F;
    if (alerts.length > 1) {
      this.fields = alerts.map(a => ({
        name: `${a.getReward().toString().replace(/^1\s/, '')} - ${a.getETAString()} left`,
        value: `${a.mission.faction} ${a.mission.type} on ${a.mission.node}\n` +
        `level ${a.mission.minEnemyLevel} - ${a.mission.maxEnemyLevel}`,
      }));
      this.title = 'Worldstate - Alerts';
      this.description = 'Currently in-progress alerts:';
    } else {
      const a = alerts[0];
      const item = a.getReward().toString().replace(/\s*\+\s*\d*cr/ig, '').replace(/^1\s/, '');
      this.title = item === '' ? a.getReward().replace(/^1\s/, '') : item;
      if(a.getReward().getTypesFull()[0].color) {
        this.color = a.getReward().getTypesFull()[0].color; 
      }
      this.thumbnail.url = a.getReward().getTypesFull()[0].thumbnail;
      const summary = `${a.mission.faction} ${a.mission.type} on ${a.mission.node}`;
      this.description = a.getDescription() && a.getDescription() !== '' ? a.getDescription() : summary;
      this.fields = [];
      if (this.description !== summary) {
        this.fields.push({ name: '_ _', value: `${a.mission.faction} ${a.mission.type} on ${a.mission.node}` });
      }
      this.fields.push({ name: 'Levels:', value: `${a.mission.minEnemyLevel} - ${a.mission.maxEnemyLevel}`, inline: true });
      this.fields.push({ name: 'Archwing Required', value: a.mission.archwingRequired ? 'Yes' : 'No', inline: true });

      if (this.title.indexOf('cr') === -1) {
        this.fields.push({ name: '_ _', value: `**Credits:** ${a.getReward().credits}cr`, inline: true });
      }
      this.footer.text = `${a.getETAString()} remaining | ${new Date().toLocaleString()}`;
    }
  }
}

module.exports = AlertEmbed;
