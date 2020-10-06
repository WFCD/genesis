'use strict';

const BaseEmbed = require('./BaseEmbed.js');
const { emojify } = require('../CommonFunctions');

const rarity = {
  common: 0x775448,
  uncommon: 0x5B5B64,
  rare: 0xB19452,
  legendary: 0xD8DAD9,
  riven: 0xA892C6,
  peculiar: 0x626360,
};

class ModEmbed extends BaseEmbed {
  constructor(bot, modData) {
    super();

    this.title = modData.name;
    this.color = rarity[modData.rarity.toLowerCase()];

    // If we have a description, show it. For stance mods, etc
    if (modData.description) {
      this.description = `_${emojify(modData.description)}_`;
    }

    // If we have an effect, show the max rank effect
    const statsLength = modData.levelStats.length;
    if (modData.levelStats && statsLength > 0) {
      const stats = modData.levelStats[statsLength - 1].stats.join('\n');
      this.description = `_${emojify(stats)}_`;
    }

    this.url = `https://warframe.fandom.com/wiki/${modData.name.replace(/\s/ig, '_')}`;
    this.image = {
      url: `https://cdn.warframestat.us/img/${modData.imageName}`,
    };
    this.fields = [{
      name: 'Polarity',
      value: emojify(modData.polarity.toLowerCase()),
      inline: true,
    }, {
      name: 'Max Rank',
      value: String(modData.fusionLimit),
      inline: true,
    }, {
      name: 'Type',
      value: String(modData.type),
      inline: true,
    }, {
      name: 'Rarity',
      value: modData.rarity,
      inline: true,
    }, {
      name: 'Base Drain',
      value: String(Math.abs(modData.baseDrain)),
      inline: true,
    }, {
      name: 'Tradeable',
      value: modData.tradable ? '✅' : '❌',
      inline: true,
    }];
  }
}

module.exports = ModEmbed;
