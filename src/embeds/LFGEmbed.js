import BaseEmbed from './BaseEmbed.js';

const expiredC = process.env.LFG_EXPIRED_COLOR ? Number.parseInt(process.env.LFG_EXPIRED_COLOR, 16) : 0xff0000;
const activeC = process.env.LFG_ACTIVE_COLOR ? Number.parseInt(process.env.LFG_ACTIVE_COLOR, 16) : 0x9370db;

/**
 * A collection of strings that are used by the parser to produce markdown-formatted text
 * @typedef {Object.<string>} LFG
 * @property {module:"discord.js".User} author      - LFG Author
 * @property {string} location          - Where people would like to group
 * @property {string} duration          - How long to go for
 * @property {string} goal              - Goal to farm for
 * @property {string} platform          - What platform to recruit on
 */

/**
 * Generates LFG embeds
 */
export default class LFGEmbed extends BaseEmbed {
  /**
   * @param {LFG} lfg - LFG Options
   * @param {module:i18n-string-templates.I18n} i18n internationalizer
   * @param {string} locale locality
   */
  constructor(lfg, { i18n, locale }) {
    super(locale);
    this.setColor(lfg.expiry ? activeC : expiredC);
    this.setTitle(i18n`${lfg.types.length ? lfg.types.join(' & ') : i18n`LFG`} Posted by ${lfg.author.tag}`);
    this.setFields([
      { name: i18n`Where`, value: lfg.location, inline: true },
      { name: i18n`Time`, value: lfg.duration, inline: true },
      { name: i18n`Farming For`, value: lfg.goal, inline: true },
      { name: i18n`Platform`, value: lfg.platform.toUpperCase(), inline: true },
      { name: i18n`Need`, value: `${lfg.membersNeeded - lfg.members.length}`, inline: true },
      { name: i18n`Members`, value: lfg.members.map((id) => `<@!${id}>`).join(', '), inline: true },
    ]);

    if (lfg.vc.channel) {
      this.addFields([
        {
          name: i18n`Voice Chat`,
          value: `<#${lfg.vc.channel.id}>`,
          inline: true,
        },
      ]);
    }

    if (lfg.expiry !== 0) {
      this.addFields([
        {
          name: '_ _',
          value: i18n`Expires <t:${(lfg.expiryTs / 1000).toFixed(0)}:R>`,
          inline: false,
        },
      ]);
    }
    const ed = lfg.edited ? i18n`Edited` : i18n`Posted`;
    this.setFooter({ text: lfg.expiry === 0 ? i18n`Expired • ${ed}` : ed });
  }
}
