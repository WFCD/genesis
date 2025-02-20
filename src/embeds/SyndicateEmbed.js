import { syndicates } from '../resources/index.js';
import { assetBase, wikiBase } from '../utilities/CommonFunctions.js';

import BaseEmbed from './BaseEmbed.js';

const syndicateThumb = `${assetBase}/img/syndicate.png`;
const values = syndicates.map((s) => s.display);

const makeJobs = (mission, numSyndMissions) => {
  if (mission.jobs && mission.jobs.length) {
    const tokens = [];
    mission.jobs.forEach((job) => {
      const totalStanding = job.standingStages.reduce((a, b) => a + b, 0);
      const levels = job.enemyLevels.join(' - ');
      const rewards = job.rewardPool instanceof Array ? job.rewardPool.join(' • ') : job.rewardPool;
      tokens.push(`\u200B \\⬆  ${totalStanding} - ${job.type} (${levels})`);
      if (job.rewardPool[0] && !job.rewardPool[0].startsWith('Pattern Mismatch.')) {
        tokens.push(`\\💰 ${rewards}\n`);
      }
    });

    if (numSyndMissions > 1) {
      tokens.push(`\n**Expires in ${mission.eta}**`);
    }

    return tokens.join('\n');
  }
  return undefined;
};
const makeMissionValue = (mission, syndMissions) => {
  if (!mission) {
    return 'No Nodes or Jobs Available';
  }
  const jobs = mission.jobs.length ? makeJobs(mission, syndMissions.length) : '';
  const nodes = mission.nodes.length
    ? `${mission.nodes.join('\n')}${syndMissions.length < 2 ? '' : `\n\n**Expires in ${mission.eta}**`}`
    : '';
  let value = 'No Nodes or Jobs Available';
  if (jobs.length) {
    value = jobs;
  } else if (nodes.length) {
    value = nodes;
  }
  return value;
};

class SyndicateEmbed extends BaseEmbed {
  constructor(missions, { syndicate, platform, skipCheck, i18n, locale }) {
    super(locale);
    // Set default fields
    this.setColor(0xff0000);
    this.setFields([
      {
        name: 'No such Syndicate',
        value: `Valid values: ${values.join(', ')}`,
      },
    ]);
    this.setURL(`${wikiBase}${wikiBase.endsWith('/') ? '' : '/'}Syndicates`);
    this.setThumbnail(syndicateThumb);

    const foundSyndicate =
      missions.length && values.find((v) => syndicate && v.toLowerCase() === syndicate.toLowerCase());
    if (foundSyndicate || skipCheck) {
      let syndMissions;
      if (!skipCheck) {
        syndMissions = missions.filter((m) => m.syndicate === foundSyndicate || foundSyndicate === 'all');
      } else {
        syndMissions = missions;
      }
      if (syndMissions.length) {
        this.setTitle(i18n`[${platform.toUpperCase()}] Syndicates`);
        this.setColor(0x00ff00);
        if (syndMissions.length < 2) {
          this.setTitle(`[${platform.toUpperCase()}] ${syndMissions[0].syndicate}`);
          this.setFooter({ text: i18n`Expires in ${syndMissions[0].eta}` });
          this.setTimestamp(syndMissions[0].expiry);
        }
        if (syndMissions.length < 2) {
          const missionValue = makeMissionValue(syndMissions[0], syndMissions);

          if (missionValue.length < 2000) {
            this.setDescription(missionValue);
            this.setFields([]);
          } else {
            this.setFields(
              missionValue.split('\n\n').map((spv) => ({
                name: '\u200B',
                value: spv,
                inline: false,
              }))
            );
          }
        } else {
          this.setFields(
            syndMissions.map((m) => ({
              name: syndMissions.length < 2 ? '\u200B' : m.syndicate,
              value: makeMissionValue(m, syndMissions),
              inline: !(m.jobs.length > 0),
            }))
          );
        }
      }
    }
  }
}

export default SyndicateEmbed;
