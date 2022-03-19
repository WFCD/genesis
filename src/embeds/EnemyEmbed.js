'use strict';

const BaseEmbed = require('./BaseEmbed.js');

const { emojify } = require('../CommonFunctions.js');

module.exports = class EnemyEmbed extends BaseEmbed {
  constructor(enemy, { i18n }) {
    super();
    if (!enemy || !enemy.health) {
      this.title = i18n`Invalid Query`;
      this.color = 0xff6961;
      this.footer = undefined;
      return;
    }

    this.title = i18n`${enemy.name} • ${enemy.type}`;
    this.description = enemy.description;
    this.fields = [{
      name: i18n`Health Base`,
      value: String(enemy.health),
      inline: true,
    }, {
      name: i18n`Shield Base`,
      value: String(enemy.shield),
      inline: true,
    }, {
      name: i18n`Armor Base`,
      value: String(enemy.armor),
      inline: true,
    }];

    enemy?.resistances?.forEach((resistance) => {
      const field = {
        name: i18n`Resistances for ${resistance.type} • ${resistance.amount}`,
        value: '',
        inline: true,
      };

      const affectors = [];
      resistance.affectors.forEach((affector) => {
        if (affector.modifier) {
          affectors.push(`${emojify(affector.element)} ${affector.modifier > 0 ? '+' : ''}${(affector.modifier * 100).toFixed(2)}`);
        }
      });
      if (affectors.length) {
        field.value = affectors.join('\n');
        this.fields.push(field);
      }
    });
  }
};
