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
   * @param {string} language - language
   */
  constructor(bot, enemies, { platform = 'pc', language = 'en' }) {
    super();

    const upperPlatform = platform.toUpperCase();
    this.thumbnail = {
      url: 'http://i.imgur.com/pMRt2Cp.png',
    };
    this.title = bot.stringManager.getString('acolytes_group_title', undefined, {
      language, replacements: { platform: upperPlatform },
    });
    if (enemies.length > 1) {
      this.color = enemies.length > 2 ? 0x00ff00 : 0xff0000;
      this.fields = enemies.map(e => ({
        name: e.agentType,
        value: bot.stringManager.getString('acolytes_group_value', undefined, {
          language,
          replacements: {
            lastDiscoveredAt: e.lastDiscoveredAt,
            healthPercent: (100 * Number(e.healthPercent)).toFixed(2),
            discovery: e.isDiscovered ? 'discovered' : 'not discovered',
          },
        }),
      }));
    } else if (enemies.length === 1) {
      const e = enemies[0];
      this.color = 0xaf5b4b;
      this.title = bot.stringManager.getString('acolytes_single_title', undefined, {
        language, replacements: { platform: upperPlatform, acolyte: e.agentType },
      });
      this.description = bot.stringManager.getString('acolytes_single_dscription', undefined, {
        language, replacements: { discovery: e.isDiscovered ? 'Discovered' : 'Hiding' },
      });

      this.fields = [{
        name: '_ _',
        value: bot.stringManager.getString('acolytes_single_value_discovery', undefined, {
          language, replacements: { discovery: e.isDiscovered ? 'Discovered' : 'Hiding', lastDiscoveredAt: e.lastDiscoveredAt },
        }),
      },

      {
        name: '_ _',
        value: bot.stringManager.getString('acolytes_single_health_remaining', undefined, {
          language, replacements: { healthPercent: (100 * Number(e.healthPercent)).toFixed(2) },
        }),
      },
      {
        name: '_ _',
        value: bot.stringManager.getString('acolytes_single_flee', undefined, {
          language, replacements: { fleeDamage: e.fleeDamage },
        }),
      }];
    } else {
      this.color = 0xaf5b4b;
      this.fields = [{
        name: bot.stringManager.getString('acolytes_none', undefined, { language }),
        value: '_ _',
      }];
    }
  }
}

module.exports = EnemyEmbed;
