'use strict';

const BaseEmbed = require('./BaseEmbed.js');

/**
 * Generates enemy embeds
 */
class EnemyEmbed extends BaseEmbed {
  /**
   * @param {Genesis} bot - An instance of Genesis
   * @param {Array.<PersistentEnemy>} enemies - The persistentEnemies to be included in the embed
   * @param {string} platform - platform
   */
  constructor(bot, enemies, platform) {
    super();

    this.thumbnail = {
      url: 'http://i.imgur.com/pMRt2Cp.png',
    };
    this.title = `[${platform.toUpperCase()}] Acolytes`;
    if (enemies.length > 1) {
      this.color = enemies.length > 2 ? 0x00ff00 : 0xff0000;
      this.fields = enemies.map(e => ({
        name: e.agentType,
        value: `Last discovered at ${e.lastDiscoveredAt}.\n` +
          `It has ${(100 * Number(e.healthPercent)).toFixed(2)}% health remaining ` +
          `and is currently ${e.isDiscovered ? 'discovered' : 'not discovered'}`,
      }));
    } else if (enemies.length === 1) {
      const e = enemies[0];
      this.title = `[${platform.toUpperCase()}] ${e.agentType}`;
      this.description = `Enemy ${e.discovered ? 'Discovered' : 'Hiding'}!`;
      this.color = 0xaf5b4b;
      this.fields = [{ name: '_ _', value: `**${e.discovered ? '' : 'Last '}Discovered At:** ${e.lastDiscoveredAt}` },
        { name: '_ _', value: `**Health Remaining:** ${(100 * Number(e.healthPercent)).toFixed(2)}%` },
        { name: '_ _', value: `Will flee after ${e.fleeDamage} damage.\nGet after the Acolyte, Tenno!` }];
    } else {
      this.color = 0xaf5b4b;
      this.fields = [{ name: 'There are currently no enemies to combat', value: '_ _' }];
    }
  }
}

module.exports = EnemyEmbed;
