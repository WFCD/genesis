'use strict';

const BaseEmbed = require('./BaseEmbed.js');

const { timeDeltaToString, fromNow, assetBase } = require('../CommonFunctions.js');

const solaris = `${assetBase}/img/solarisunitedflag.png`;

const makeJobs = (mission) => {
  if (mission && mission.jobs && mission.jobs.length) {
    const tokens = [];
    mission.jobs.forEach((job) => {
      const totalStanding = job.standingStages.reduce((a, b) => a + b, 0);
      const levels = job.enemyLevels.join(' - ');
      const rewards = job.rewardPool instanceof Array ? job.rewardPool.join(', ') : '';
      tokens.push(`:arrow_up: ${totalStanding} - ${job.type} (${levels})`);
      if (job.rewardPool === rewards) {
        tokens.push(`:moneybag: ${rewards}\n`);
      }
    });

    tokens.push(`\n**Expires in ${mission.eta}**`);

    return tokens.join('\n');
  }
  return undefined;
};

/**
 * Generates Vallis cycle embeds
 */
class SolarisEmbed extends BaseEmbed {
  /**
   * @param {Genesis} bot - An instance of Genesis
   * @param {Object} state - The current state of the cycle
   */
  constructor(bot, state) {
    super();

    this.title = `Worldstate - Orb Vallis Cycle - ${state.isWarm ? 'Warm' : 'Cold'}`;
    this.color = state.isWarm ? 0xB64624 : 0x000066;
    this.thumbnail = {
      url: solaris,
    };
    const warmstring = `Time remaining until ${state.isWarm ? 'cold' : 'warm'}: ${timeDeltaToString(fromNow(new Date(state.expiry)))}`;
    this.description = `${makeJobs(state.bounty, 1)}\n\n${warmstring}`;

    this.footer.text = `${state.isWarm ? 'Cold' : 'Warm'} starts `;
    this.timestamp = new Date(state.expiry);
  }
}

module.exports = SolarisEmbed;
