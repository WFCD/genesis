'use strict';

const BaseEmbed = require('./BaseEmbed.js');

/**
 * Generates enemy embeds
 */
class ComponentEmbed extends BaseEmbed {
  /**
   * @param {Genesis} bot - An instance of Genesisad
   * @param {Array.<Component>} components - List of components for an item or weapon
   */
  constructor(bot, components) {
    super();
    this.title = 'Components';
    this.color = 0xD3D3D3;
    this.fields = components.map((component) => {
      const tokens = [];
      tokens.push(`_${component.description}_\n`);
      tokens.push(component.itemCount ? `**#:** ${component.itemCount}\n` : '');
      tokens.push(component.ducats ? `**Ducats:** ${component.ducats}\n` : '');
      tokens.push(`**Tradeable:** ${component.ducats ? 'Yes' : 'No'}`);
      tokens.push('\n\u200B\n');
      return {
        name: component.name,
        value: tokens.join(''),
      };
    });
  }
}

module.exports = ComponentEmbed;
