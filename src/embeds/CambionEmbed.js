'use strict';

const BaseEmbed = require('./BaseEmbed.js');

const {
  timeDeltaToString, fromNow, assetBase, toTitleCase,
} = require('../CommonFunctions.js');

const fass = `${assetBase}/img/FassBanner.png`;
const vome = `${assetBase}/img/VomeBanner.png`;

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

class CambionEmbed extends BaseEmbed {
  constructor(bot, state) {
    super();

    this.title = `Cambion Drift Cycle - ${toTitleCase(state.active)}`;
    this.color = state.active === 'fass' ? 0xC6733F : 0x415B9E;
    this.thumbnail = {
      url: state.active === 'fass' ? fass : vome,
    };

    const next = toTitleCase(state.active === 'fass' ? 'vome' : 'fass');

    const nextCtd = `Time remaining until ${next}: ${timeDeltaToString(fromNow(new Date(state.expiry)))}`;
    this.description = `${state.bounty ? makeJobs(state.bounty) : ''}\n\n${nextCtd}`;

    this.footer.text = `${next} starts `;
    this.timestamp = new Date(state.expiry);
  }
}

module.exports = CambionEmbed;
