'use strict';

const BaseEmbed = require('./BaseEmbed.js');

/**
 * Generates enemy embeds
 */
class EnemyEmbed extends BaseEmbed {
  /**
   * @param {Genesis} bot - An instance of Genesis
   * @param {Array.<PersistentEnemy>} enemies - The persistentEnemies to be included in the embed
   */
  constructor(bot, enemies) {
    super();

    this.thumbnail = {
      url: 'http://i.imgur.com/KDMV660.png',
    };
    this.title = 'Worldstate - Enemies';
    this.description = 'Currently discovered enemies:';
    if (enemies.length > 1) {
      this.color = enemies.length > 2 ? 0x00ff00 : 0xff0000;
      this.fields = enemies.map(e => ({
        name: e.agentType,
        value: `Last discovered at ${e.lastDiscoveredAt}.\nIt has ${e.healthPercent}% health remaining and is currently ${e.isDiscovered ? 'discovered' : 'not discovered'}`,
      }));
    } else if (enemies.length === 1) {
      const e = enemies[0];
      this.title = e.agentType;
      this.description = 'Enemy Discovered!';
      this.color = 0xaf5b4b;
      this.fields = [{ name: '_ _', value: `**Discovered At:** ${this.lastDiscoveredAt}` },
      { name: '_ _', value: `**Health Remaining:** ${this.healthPercent}%` },
      { name: '_ _', value: `**Discovered At:** ${this.lastDiscoveredAt}` }];
    } else {
      this.color = 0xaf5b4b;
      this.fields = [{ name: 'There are currently no enemies to combat', value: '_ _' }];
    }
  }
}

module.exports = EnemyEmbed;
