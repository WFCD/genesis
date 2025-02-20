import { assetBase, emojify } from '../utilities/CommonFunctions.js';

import BaseEmbed from './BaseEmbed.js';

const steelPathThumb = `${assetBase}/img/steelpath.png`;
export default class SteelPathEmbed extends BaseEmbed {
  constructor(offering, { isCommand = false, i18n, locale }) {
    super(locale);
    this.setDescription(`${i18n`**Rotating:**`} ${offering.currentReward.name || offering.currentReward}: ${
      offering.currentReward.cost || '???'
    }${isCommand ? emojify('steelessence') : i18n` essence`}
    
  ${i18n`**Evergreen:**`}
  ${offering.evergreens
    .map(
      (reward) =>
        `:white_small_square: ${reward.name}: ${reward.cost}${isCommand ? emojify('steelessence') : i18n` essence`}`
    )
    .join('\n')}`);

    this.setFooter({ text: i18n`Cycles at` });
    this.setTimestamp(offering.expiry);
    this.setTitle(i18n`Steel Path Offerings`);
    this.setThumbnail(steelPathThumb);
    this.setColor(0x43464b);
  }
}
