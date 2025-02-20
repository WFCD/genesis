import { assetBase } from '../utilities/CommonFunctions.js';
import { rTime } from '../utilities/Wrappers.js';

import BaseEmbed from './BaseEmbed.js';

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

    tokens.push(`\n**Expires in ${mission.eta}**`);

    return tokens.join('\n');
  }
  return undefined;
};

export default class SolarisEmbed extends BaseEmbed {
  constructor(state, { i18n, locale }) {
    super(locale);

    this.title = `Orb Vallis - ${state.isWarm ? 'Warm' : 'Cold'}`;
    this.color = state.isWarm ? 0xb64624 : 0x000066;
    this.thumbnail = {
      url: solaris,
    };
    const warmstring = i18n`Time remaining until ${state.isWarm ? i18n`Cold` : i18n`Warm`}: ${rTime(state.expiry)}`;
    this.description = `${state.bounty ? makeJobs(state.bounty) : ''}\n\n${warmstring}`;

    this.setFooter({ text: `${state.isWarm ? i18n`Cold` : i18n`Warm`} starts ` });
    this.timestamp = new Date(state.expiry).getTime();
  }
}
