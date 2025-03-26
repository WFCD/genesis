import { assetBase } from '../utilities/CommonFunctions.js';

import BaseEmbed from './BaseEmbed.js';

const acolyteThumb = `${assetBase}/img/acolyte.png`;

export default class AcolyteEmbed extends BaseEmbed {
  /**
   * Create an embed from an array, or single, enemy
   * @param {WorldState.PersistentEnemy | WorldState.PersistentEnemy[]} enemies enemy to be fought
   * @param {string} platform platform of the worldstate
   * @param {I18n} i18n translator
   * @param {string} locale locale of the worldstate
   */
  constructor(enemies, { platform, i18n, locale }) {
    super(locale);

    this.setThumbnail(acolyteThumb);
    this.setTitle(i18n`[${platform.toUpperCase()}] Acolytes`);
    if (Array.isArray(enemies) && enemies.length > 1) {
      this.setColor(enemies.length > 2 ? 0x00ff00 : 0xff0000);
      this.setFields(
        enemies.map((e) => ({
          name: e.agentType,
          value: i18n`Last discovered at ${e.lastDiscoveredAt}.
It has ${(100 * Number(e.healthPercent)).toFixed(2)}% health remaining
and is currently ${e.isDiscovered ? 'discovered' : 'not discovered'}`,
        }))
      );
    } else if (!Array.isArray(enemies) || enemies.length === 1) {
      const e = Array.isArray(enemies) ? enemies[0] : enemies;
      this.setTitle(i18n`[${platform.toUpperCase()}] ${e.agentType}`);
      this.setDescription(i18n`Enemy ${e.isDiscovered ? i18n`Discovered` : i18n`Hiding`}!`);
      this.setColor(0xaf5b4b);
      this.setFields([
        { name: '\u200B', value: `**${e.isDiscovered ? '' : 'Last '}Discovered At:** ${e.lastDiscoveredAt}` },
        { name: '\u200B', value: `**Health Remaining:** ${(100 * Number(e.healthPercent)).toFixed(2)}%` },
        { name: '\u200B', value: `Will flee after ${e.fleeDamage} damage.\nGet after the Acolyte, Tenno!` },
      ]);
    } else {
      this.setColor(0xaf5b4b);
      this.setFields([
        {
          name: i18n`There are currently no enemies to combat`,
          value: '\u200B',
        },
      ]);
    }
  }
}
