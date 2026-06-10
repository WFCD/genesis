import { syndicates } from '#shared/resources/index';
import { assetBase, wikiBase } from '#shared/utilities/CommonFunctions';
import { eta } from '#shared/utilities/WorldState';

import BaseEmbed from './BaseEmbed';
import type { EmbedBuildOptions } from './embedOptions';

const syndicateThumb = `${assetBase}/img/syndicate.png`;
const values = syndicates.map((s) => s.display);

const uniqueRewardPool = (pool: string[] | string | undefined) => {
  if (!pool) return [];
  const items = Array.isArray(pool) ? pool : [pool];
  return [...new Set(items)];
};

const makeJobs = (mission, numSyndMissions) => {
  if (mission.jobs && mission.jobs.length) {
    const tokens = [];
    mission.jobs.forEach((job) => {
      const totalStanding = job.standingStages.reduce((a, b) => a + b, 0);
      const levels = job.enemyLevels.join(' - ');
      const rewardItems = uniqueRewardPool(job.rewardPool);
      const rewards = rewardItems.join(' • ');
      tokens.push(`\u200B \\⬆  ${totalStanding} - ${job.type} (${levels})`);
      if (rewardItems[0] && !rewardItems[0].startsWith('Pattern Mismatch.')) {
        tokens.push(`\\💰 ${rewards}\n`);
      }
    });

    if (numSyndMissions > 1) {
      tokens.push(`\n**Expires in ${eta(mission)}**`);
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
    ? `${mission.nodes.join('\n')}${syndMissions.length < 2 ? '' : `\n\n**Expires in ${eta(mission)}**`}`
    : '';
  let value = 'No Nodes or Jobs Available';
  if (jobs.length) {
    value = jobs;
  } else if (nodes.length) {
    value = nodes;
  }
  return value;
};

/** One embed page per bounty job or invasion node. */
export const expandSyndicateMissionPages = (missions) =>
  missions.flatMap((mission) => {
    if (mission.jobs?.length) {
      return mission.jobs.map((job) => ({ ...mission, jobs: [job], nodes: [] }));
    }
    if (mission.nodes?.length) {
      return mission.nodes.map((node) => ({ ...mission, jobs: [], nodes: [node] }));
    }
    return [mission];
  });

const pageTitle = (platform, mission) => {
  const prefix = `[${platform.toUpperCase()}] ${mission.syndicate}`;
  if (mission.jobs?.length === 1) {
    return `${prefix} — ${mission.jobs[0].type}`;
  }
  if (mission.nodes?.length === 1) {
    return `${prefix} — ${mission.nodes[0]}`;
  }
  return prefix;
};

class SyndicateEmbed extends BaseEmbed {
  constructor(missions, { syndicate, platform, skipCheck, i18n, locale }: EmbedBuildOptions) {
    super(locale);
    // Set default fields
    this.color = 0xff0000;
    this.fields = [
      {
        name: 'No such Syndicate',
        value: `Valid values: ${values.join(', ')}`,
      },
    ];
    this.url = `${wikiBase}${wikiBase.endsWith('/') ? '' : '/'}Syndicates`;
    this.thumbnail = {
      url: syndicateThumb,
    };

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
        this.title = i18n`[${platform.toUpperCase()}] Syndicates`;
        this.color = 0x00ff00;
        if (syndMissions.length < 2) {
          this.title = pageTitle(platform, syndMissions[0]);
          this.footer.text = i18n`Expires in ${eta(syndMissions[0])}`;
          this.timestamp = syndMissions[0].expiry;
        }
        if (syndMissions.length < 2) {
          const missionValue = makeMissionValue(syndMissions[0], syndMissions);

          if (missionValue.length < 2000) {
            this.description = missionValue;
            this.fields = undefined;
          } else {
            this.fields = missionValue.split('\n\n').map((spv) => ({
              name: '\u200B',
              value: spv,
              inline: false,
            }));
          }
        } else {
          this.fields = syndMissions.map((m) => ({
            name: syndMissions.length < 2 ? '\u200B' : m.syndicate,
            value: makeMissionValue(m, syndMissions),
            inline: !(m.jobs.length > 0),
          }));
        }
      }
    }
  }
}

export default SyndicateEmbed;
