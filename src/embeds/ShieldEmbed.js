import { assetBase } from '../utilities/CommonFunctions.js';

import BaseEmbed from './BaseEmbed.js';

export default class ShieldEmbed extends BaseEmbed {
  static #corpus = `${assetBase}/img/corpus.png`;
  static #shieldCalc(baseShields, baseLevel, currentLevel) {
    return (
      parseFloat(baseShields) +
      (parseFloat(currentLevel) - parseFloat(baseLevel)) ** 2 * 0.0075 * parseFloat(baseShields)
    ).toFixed(2);
  }
  static #shieldString(shields, level, i18n) {
    return i18n`At level ${parseFloat(level).toFixed(0)}, your enemy would have ${shields} Shields.`;
  }
  constructor(params, { i18n }) {
    super();
    this.color = params && params.length > 3 ? 0x00ff00 : 0xff0000;
    this.title = i18n`Warframe - Shields`;
    this.url = 'https://warframe.com';
    this.thumbnail = {
      url: ShieldEmbed.#corpus,
    };
    this.fields = [
      {
        name: '\u200B',
        value: '',
      },
    ];

    if (params && params.length > 3) {
      const shields = params[1];
      const baseLevel = params[2];
      const currentLevel = params[3];
      const calc = ShieldEmbed.#shieldCalc(shields, baseLevel, currentLevel);
      this.fields[0].name = i18n`Shield calculation`;
      this.fields[0].value = ShieldEmbed.#shieldString(calc, currentLevel, i18n);
    } else {
      this.fields[0].value = '`shields (Base Shelds) (Base Level) (Current Level)` - calculate shields and stats.';
      this.fields[0].name = 'Possible uses include:';
    }
  }
}
