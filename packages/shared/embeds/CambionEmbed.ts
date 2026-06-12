import { assetBase, toTitleCase } from '#shared/utilities/CommonFunctions';
import { rTime } from '#shared/utilities/Wrappers';

import BaseEmbed from './BaseEmbed';
import { formatCycleLinks, formatCycleTips, getCambionCycleContext } from './cycleContext';
import type { EmbedBuildOptions } from './embedOptions';

const fass = `${assetBase}/img/FassBanner.png`;
const vome = `${assetBase}/img/VomeBanner.png`;

const makeJobs = (mission, i18n) => {
  if (mission && mission.jobs && mission.jobs.length) {
    const tokens = [];
    mission.jobs.forEach((job) => {
      const totalStanding = job.standingStages.reduce((a, b) => a + b, 0);
      const levels = job.enemyLevels.join(' - ');
      const rewards = job.rewardPool instanceof Array ? job.rewardPool.join(' • ') : '';
      tokens.push(`\u200B ⬆  ${totalStanding} - ${job.type} (${levels})`);
      if (job.rewardPool[0] && !job.rewardPool[0].startsWith('Pattern Mismatch.')) {
        tokens.push(`💰 ${rewards}\n`);
      }
    });

    tokens.push(i18n`\n**Expires in ${rTime(mission.expiry)}**`);

    return tokens.join('\n');
  }
  return undefined;
};

export default class CambionEmbed extends BaseEmbed {
  /**
   * Cambion cycle embed to display current cycle state
   * @param {WorldState.CambionCycle} state - the current cambion cycle state
   * @param {I18n} i18n - the translator
   * @param {string }locale - locale of the worldstate
   */
  constructor(state, { i18n, locale }: EmbedBuildOptions) {
    super(locale);
    const context = getCambionCycleContext(state.state);
    const phase = toTitleCase(state.state);
    const next = toTitleCase(state.state === 'fass' ? 'vome' : 'fass');

    this.title = i18n`Cambion Drift Cycle - ${phase}`;
    this.color = state.state === 'fass' ? 0xc6733f : 0x415b9e;
    this.thumbnail = {
      url: state.state === 'fass' ? fass : vome,
    };
    this.url = context.map;

    const bountyBlock = state.bounty ? makeJobs(state.bounty, i18n) : '';
    const timerLine = i18n`Time remaining until ${next}: ${rTime(state.expiry)}`;

    this.description = [
      bountyBlock,
      timerLine,
      i18n`${phase} lasts **${context.duration}**. ${context.summary}`,
      formatCycleLinks(context),
    ]
      .filter(Boolean)
      .join('\n\n');

    this.fields = [
      {
        name: i18n`During ${phase}`,
        value: formatCycleTips(context.tips),
        inline: false,
      },
    ];

    this.footer.text = i18n`${next} starts `;
    this.timestamp = new Date(state.expiry).getTime();
  }
}
