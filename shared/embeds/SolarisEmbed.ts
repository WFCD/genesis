import { assetBase } from '#shared/utilities/CommonFunctions';
import { rTime } from '#shared/utilities/Wrappers';
import { eta } from '#shared/utilities/WorldState';

import BaseEmbed from './BaseEmbed';
import { formatCycleLinks, formatCycleTips, getVallisCycleContext } from './cycleContext';
import type { EmbedBuildOptions } from './embedOptions';

const solaris = `${assetBase}/img/solarisunitedflag.png`;
const makeJobs = (mission) => {
  if (mission && mission.jobs && mission.jobs.length) {
    const tokens = [];
    mission.jobs.forEach((job) => {
      const totalStanding = job.standingStages.reduce((a, b) => a + b, 0);
      const levels = job.enemyLevels.join(' - ');
      const rewards = job.rewardPool instanceof Array ? job.rewardPool.join(' • ') : '';
      tokens.push(`\u200B \\⬆  ${totalStanding} - ${job.type} (${levels})`);
      if (job.rewardPool[0] && !job.rewardPool[0].startsWith('Pattern Mismatch.')) {
        tokens.push(`\\💰 ${rewards}\n`);
      }
    });

    tokens.push(`\n**Expires in ${eta(mission)}**`);

    return tokens.join('\n');
  }
  return undefined;
};

export default class SolarisEmbed extends BaseEmbed {
  constructor(state, { i18n, locale }: EmbedBuildOptions) {
    super(locale);
    const context = getVallisCycleContext(state.isWarm);
    const phase = state.isWarm ? i18n`Warm` : i18n`Cold`;
    const next = state.isWarm ? i18n`Cold` : i18n`Warm`;

    this.title = `Orb Vallis - ${state.isWarm ? 'Warm' : 'Cold'}`;
    this.color = state.isWarm ? 0xb64624 : 0x000066;
    this.thumbnail = {
      url: solaris,
    };
    this.url = context.map;

    const bountyBlock = state.bounty ? makeJobs(state.bounty) : '';
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

    this.footer.text = `${next} starts `;
    this.timestamp = new Date(state.expiry).getTime();
  }
}
