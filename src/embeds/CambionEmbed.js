import { assetBase, toTitleCase } from '../utilities/CommonFunctions.js';
import { rTime } from '../utilities/Wrappers.js';

import BaseEmbed from './BaseEmbed.js';

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
  constructor(state, { i18n, locale }) {
    super(locale);
    this.title = i18n`Cambion Drift Cycle - ${toTitleCase(state.active)}`;
    this.color = state.active === 'fass' ? 0xc6733f : 0x415b9e;
    this.thumbnail = {
      url: state.active === 'fass' ? fass : vome,
    };

    const next = toTitleCase(state.active === 'fass' ? 'vome' : 'fass');

    const nextCtd = i18n`Time remaining until ${next}: ${rTime(state.expiry)}`;
    this.description = `${state.bounty ? makeJobs(state.bounty, i18n) : ''}\n\n${nextCtd}`;

    this.footer.text = i18n`${next} starts `;
    this.timestamp = new Date(state.expiry).getTime();
  }
}
