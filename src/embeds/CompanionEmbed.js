import dayjs from 'dayjs';
import duration from 'dayjs/plugin/duration.js';

import { emojify } from '../utilities/CommonFunctions.js';

import BaseEmbed from './BaseEmbed.js';

dayjs.extend(duration);

export default class CompanionEmbed extends BaseEmbed {
  constructor(companion, { i18n, locale }) {
    super(locale);
    this.setTitle(companion.name)
      .setURL(`https://warframe.fandom.com/wiki/${companion.name.replace(/\s/g, '_')}`)
      .setThumbnail(`https://cdn.warframestat.us/img/${companion.imageName}`)
      .setDescription(companion.description)
      .addField(i18n`Health`, `${companion.health}`, true)
      .addField(i18n`Power`, `${companion.power}`, true)
      .addField(i18n`Armor`, `${companion.armor}`, true)
      .addField(i18n`Shields`, `${companion.shield}`, true)
      .addField(i18n`Build Time`, `${dayjs.duration({ seconds: companion.buildTime }).asHours()}h`, true)
      .addField(i18n`Build Price`, `${companion.buildPrice}${emojify('credits')}`, true)
      .addField(i18n`Build Skip`, `${companion.skipBuildTimePrice}${emojify('p')}`, true);
  }
}
