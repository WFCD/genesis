import { assetBase } from '../utilities/CommonFunctions.js';

import BaseEmbed from './BaseEmbed.js';

const conclaveThumb = `${assetBase}/img/conclave-lg.png`;
const values = ['all', 'day', 'week'];

const compareCCategory = (c, category) =>
  (c.category === category.toLowerCase() || category.toLowerCase() === 'all') && !c.rootChallenge;

export default class ConclaveChallengeEmbed extends BaseEmbed {
  constructor(challenges, { category, platform, i18n, locale }) {
    super(locale);

    const categoryInValues = category && values.indexOf(category.toLowerCase()) !== -1;
    this.setColor(categoryInValues ? 0x00ff00 : 0xff0000);
    if (categoryInValues) {
      this.setFields(
        challenges
          .filter((c) => compareCCategory(c, category))
          .map((c) => ({
            name: c.mode,
            value: `${c.description} expires in ${c.endString}`,
          }))
      );
    } else {
      this.setFields([
        {
          name: i18n`No such conclave category`,
          value: `Valid values: ${values.join(', ')}`,
        },
      ]);
    }
    this.setTitle(
      `${platform ? `[${platform.toUpperCase()}] ` : ''}Current Challenges for category: ${category || 'none'}`
    );
    this.setThumbnail(conclaveThumb);
  }
}
