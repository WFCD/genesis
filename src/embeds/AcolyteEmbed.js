import { assetBase } from '../utilities/CommonFunctions.js';

import BaseEmbed from './BaseEmbed.js';

const acolyteThumb = `${assetBase}/img/acolyte.png`;

export default class AcolyteEmbed extends BaseEmbed {
  constructor(enemies, { platform, i18n, locale }) {
    super(locale);

    this.thumbnail = {
      url: acolyteThumb,
    };
    this.title = i18n`[${platform.toUpperCase()}] Acolytes`;
    if (Array.isArray(enemies) && enemies.length > 1) {
      this.color = enemies.length > 2 ? 0x00ff00 : 0xff0000;
      this.fields = enemies.map((e) => ({
        name: e.agentType,
        value: i18n`Last discovered at ${e.lastDiscoveredAt}.
It has ${(100 * Number(e.healthPercent)).toFixed(2)}% health remaining
and is currently ${e.isDiscovered ? 'discovered' : 'not discovered'}`,
      }));
    } else if (!Array.isArray(enemies) || enemies.length === 1) {
      const e = Array.isArray(enemies) ? enemies[0] : enemies;
      this.title = i18n`[${platform.toUpperCase()}] ${e.agentType}`;
      this.description = i18n`Enemy ${e.isDiscovered ? i18n`Discovered` : i18n`Hiding`}!`;
      this.color = 0xaf5b4b;
      this.fields = [
        { name: '\u200B', value: `**${e.isDiscovered ? '' : 'Last '}Discovered At:** ${e.lastDiscoveredAt}` },
        { name: '\u200B', value: `**Health Remaining:** ${(100 * Number(e.healthPercent)).toFixed(2)}%` },
        { name: '\u200B', value: `Will flee after ${e.fleeDamage} damage.\nGet after the Acolyte, Tenno!` },
      ];
    } else {
      this.color = 0xaf5b4b;
      this.fields = [
        {
          name: i18n`There are currently no enemies to combat`,
          value: '\u200B',
        },
      ];
    }
  }
}
