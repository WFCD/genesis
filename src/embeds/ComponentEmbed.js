'use strict';

const BaseEmbed = require('./BaseEmbed.js');

/**
 * Generates enemy embeds
 */
class ComponentEmbed extends BaseEmbed {
  /**
   * @param {Array.<Component>} components - List of components for an item or weapon
   */
  constructor(components, { i18n }) {
    super();
    this.title = 'Components';
    this.color = 0xD3D3D3;
    this.fields = components.map((component) => {
      const tokens = [];
      tokens.push(`_${component.description}_\n`);
      tokens.push(component.itemCount ? i18n`**#:** ${component.itemCount}\n` : '');
      tokens.push(component.ducats ? i18n`**Ducats:** ${component.ducats}\n` : '');
      tokens.push(i18n`**Tradable:** ${component.ducats ? i18n`Yes` : i18n`No`}`);
      tokens.push('\n\u200B\n');
      return {
        name: component.name,
        value: tokens.join(''),
      };
    });
  }
}

module.exports = ComponentEmbed;
