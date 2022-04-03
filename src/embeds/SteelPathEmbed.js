import BaseEmbed from './BaseEmbed.js';

import { assetBase, emojify } from '../utilities/CommonFunctions.js';

const steelPathThumb = `${assetBase}/img/steelpath.png`;
export default class SteelPathEmbed extends BaseEmbed {
  constructor(offering, { isCommand = false, i18n, locale }) {
    super(locale);
    this.description = `${i18n`**Rotating:**`} ${offering.currentReward.name || offering.currentReward}: ${
      offering.currentReward.cost || '???'
    }${isCommand ? emojify('steelessence') : i18n` essence`}
    
  ${i18n`**Evergreen:**`}
  ${offering.evergreens
    .map(
      (reward) =>
        `:white_small_square: ${reward.name}: ${reward.cost}${isCommand ? emojify('steelessence') : i18n` essence`}`
    )
    .join('\n')}`;

    this.footer.text = i18n`Cycles at`;
    this.timestamp = offering.expiry;
    this.title = i18n`Steel Path Offerings`;
    this.thumbnail.url = steelPathThumb;
    this.color = 0x43464b;
  }
}
