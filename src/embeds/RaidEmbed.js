import RaidStat from '../models/RaidStat.js';
import { assetBase } from '../utilities/CommonFunctions.js';

import BaseEmbed from './BaseEmbed.js';

export default class RaidStatEmbed extends BaseEmbed {
  /**
   * @param {Simaris} userStats - User raid stat json
   * @param {string} query - Query for this embed
   * @param {string} platform - Platform for the query
   * @param {I18n} i18n internationalization template
   * @param {string} locale embed locale
   */
  constructor(userStats, { query, platform, i18n, locale }) {
    super(locale);
    this.setTitle(i18n`Raid statistics for ${query}`);
    this.setURL(encodeURI(`https://${platform !== 'pc' ? `${platform}.` : ''}trials.wf/player/?user=${query}`));
    this.setColor(0xaf5b4b);
    this.setThumbnail(`${assetBase}/NightmareRaidSekhara.png`);
    const stats = {
      lor: new RaidStat(userStats, 'lor'),
      lornm: new RaidStat(userStats, 'lornm'),
      jv: new RaidStat(userStats, 'jv'),
      totals: {},
    };
    stats.totals = new RaidStat();
    stats.totals.makeTotals(stats.lor, stats.lornm, stats.jv);
    this.setFields([
      {
        name: i18n`Law of Retribution`,
        value: stats.lor.toString(),
        inline: true,
      },
      {
        name: i18n`Law of Retribution: Nightmare`,
        value: stats.lornm.toString(),
        inline: true,
      },
      {
        name: i18n`Jordas Verdict`,
        value: stats.jv.toString(),
        inline: true,
      },
      {
        name: i18n`Totals`,
        value: stats.total.toString(),
        inline: true,
      },
    ]);

    this.setFooter({ text: i18n`Evaluated by Cephalon Genesis | Source: trials.wf` });
  }
}
