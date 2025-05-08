import dayjs from 'dayjs';
import duration from 'dayjs/plugin/duration.js';

import { emojify } from '../utilities/CommonFunctions.js';

import BaseEmbed from './BaseEmbed.js';

dayjs.extend(duration);

export default class CompanionEmbed extends BaseEmbed {
  constructor(companion, { i18n, locale }) {
    super(locale);
    this.setTitle(companion.name)
      .setURL(`https://wiki.warframe.com/w/${companion.name.replace(/\s/g, '_')}`)
      .setThumbnail(`https://cdn.warframestat.us/img/${companion.imageName}`)
      .setDescription(companion.description)
      .addFields(
        { name: i18n`Health`, value: `${companion.health}`, inline: true },
        { name: i18n`Power`, value: `${companion.power}`, inline: true },
        { name: i18n`Armor`, value: `${companion.armor}`, inline: true },
        { name: i18n`Shield`, value: `${companion.shield}`, inline: true },
        {
          name: i18n`Build Time`,
          value: `${dayjs.duration({ seconds: companion.buildTime }).asHours()}h`,
          inline: true,
        },
        { name: `Build Price`, value: `${companion.buildPrice}${emojify('credits')}`, inline: true },
        { name: `Build Skip`, value: `${companion.skipBuildTimePrice}${emojify('p')}`, inline: true }
      );
  }
}
