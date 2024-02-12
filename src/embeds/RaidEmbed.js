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
    this.title = i18n`Raid statistics for ${query}`;
    this.url = encodeURI(`https://${platform !== 'pc' ? `${platform}.` : ''}trials.wf/player/?user=${query}`);
    this.color = 0xaf5b4b;
    this.thumbnail = {
      url: `${assetBase}/NightmareRaidSekhara.png`,
    };
    const stats = {
      lor: new RaidStat(userStats, 'lor'),
      lornm: new RaidStat(userStats, 'lornm'),
      jv: new RaidStat(userStats, 'jv'),
      totals: {},
    };
    stats.total = new RaidStat();
    stats.total.makeTotals(stats.lor, stats.lornm, stats.jv);
    this.fields = [
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
    ];

    this.footer.text = i18n`Evaluated by Cephalon Genesis | Source: trials.wf`;
  }
}
