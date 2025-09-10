import { assetBase } from '../utilities/CommonFunctions.js';
import { timeToEnd } from '../utilities/WorldState.js';

import BaseEmbed from './BaseEmbed.js';

const conclaveThumb = `${assetBase}/img/conclave-lg.png`;
const values = ['all', 'day', 'week'];

const compareCCategory = (c, category) =>
  (c.category === category.toLowerCase() || category.toLowerCase() === 'all') && !c.rootChallenge;

export default class ConclaveChallengeEmbed extends BaseEmbed {
  constructor(challenges, { category, platform, i18n, locale }) {
    super(locale);

    const categoryInValues = category && values.indexOf(category.toLowerCase()) !== -1;
    this.color = categoryInValues ? 0x00ff00 : 0xff0000;
    if (categoryInValues) {
      this.fields = challenges
        .filter((c) => compareCCategory(c, category))
        .map((c) => {
          const endString = timeToEnd(c);
          return {
            name: c.mode,
            value: `${c.description} expires in ${endString}`,
          };
        });
    } else {
      this.fields = [
        {
          name: i18n`No such conclave category`,
          value: `Valid values: ${values.join(', ')}`,
        },
      ];
    }
    this.title = `${platform ? `[${platform.toUpperCase()}] ` : ''}Current Challenges for category: ${
      category || 'none'
    }`;
    this.thumbnail = {
      url: conclaveThumb,
    };
  }
}
