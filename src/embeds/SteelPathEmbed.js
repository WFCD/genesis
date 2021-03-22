'use strict';

const BaseEmbed = require('./BaseEmbed.js');
const { assetBase, emojify } = require('../CommonFunctions');

const steelPathThumb = `${assetBase}/img/steelpath.png`;

module.exports = class SteelPathEmbed extends BaseEmbed {
  constructor(bot, offering, { isCommand = false, i18n }) {
    super();

    const evergreen = [
      { name: i18n`Bishamo Pauldrons Blueprint`, cost: 15 },
      { name: i18n`Bishamo Cuirass Blueprint`, cost: 25 },
      { name: i18n`Bishamo Helmet Blueprint`, cost: 20 },
      { name: i18n`Bishamo Greaves Blueprint`, cost: 25 },
      { name: i18n`10k Kuva`, cost: 15 },
      { name: i18n`Relic Pack`, cost: 15 },
      { name: i18n`Stance Forma Blueprint`, cost: 10 },
      { name: i18n`Trio Orbit Ephermera`, cost: 3 },
      { name: i18n`Crania Ephemera`, cost: 85 },
    ];

    this.description = `${i18n`**Rotating:**`} ${offering.currentReward.name || offering.currentReward}: ${offering.currentReward.cost || '???'}${isCommand ? emojify('steelessence') : i18n` essence`}

  ${i18n`**Evergreen:**`}
  ${evergreen
    .map(reward => `:white_small_square: ${reward.name}: ${reward.cost}${isCommand
      ? emojify('steelessence')
      : i18n` essence`}`)
    .join('\n')}`;

    this.footer.text = i18n`Cycles at`;
    this.timestamp = offering.expiry;
    this.title = i18n`Steel Path Offerings`;
    this.thumbnail.url = steelPathThumb;
    this.color = 0x43464b;
  }
};
