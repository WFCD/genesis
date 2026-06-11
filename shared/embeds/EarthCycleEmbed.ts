import { assetBase } from '#shared/utilities/CommonFunctions';
import { rTime } from '#shared/utilities/Wrappers';

import BaseEmbed from './BaseEmbed';
import { formatCycleLinks, formatCycleTips, getCetusCycleContext, getEarthCycleContext } from './cycleContext';
import type { EmbedBuildOptions } from './embedOptions';

const ostron = `${assetBase}/img/ostron-banner.png`;
const earth = `${assetBase}/img/earth-planet.png`;

export default class EarthCycleEmbed extends BaseEmbed {
  constructor(state, { i18n, locale }: EmbedBuildOptions) {
    super(locale);

    const isCetus = Boolean(state.isCetus);
    const context = isCetus ? getCetusCycleContext(state.isDay) : getEarthCycleContext(state.isDay);
    const nextPhase = state.isDay ? i18n`Night` : i18n`Day`;
    const place = isCetus ? i18n`Plains of Eidolon` : i18n`Earth`;

    this.title = `${isCetus ? 'PoE' : 'Earth'} - ${state.isDay ? 'Day' : 'Night'}`;
    this.color = state.isDay ? 0xb64624 : 0x000066;
    this.thumbnail = {
      url: isCetus ? ostron : earth,
    };
    this.url = context.map ?? context.wiki;

    const bountyExpiry = state.bountyExpiry ? rTime(state.bountyExpiry) : '';
    const timerLine = i18n`Time remaining until ${nextPhase}: ${rTime(state.expiry)}`;
    const bountyLine = state.bountyExpiry ? i18n`\nOstron bounties expire ${bountyExpiry}` : '';

    this.description = [
      `${timerLine}${bountyLine}`,
      i18n`${place} ${state.isDay ? i18n`day` : i18n`night`} lasts **${context.duration}**. ${context.summary}`,
      formatCycleLinks(context),
    ].join('\n\n');

    this.fields = [
      {
        name: i18n`During ${state.isDay ? i18n`Day` : i18n`Night`}`,
        value: formatCycleTips(context.tips),
        inline: false,
      },
    ];

    this.footer.text = i18n`${nextPhase} starts `;
    this.timestamp = new Date(state.expiry).getTime();
  }
}
