'use strict';

const BaseEmbed = require('./BaseEmbed.js');

const values = ['all', 'Arbiters of Hexis', 'Perrin Sequence', 'Cephalon Suda', 'Steel Meridian', 'New Loka', 'Red Veil', 'Ostrons', 'Assassins', 'Quills'];

/**
 * Generates syndicate embeds
 */
class SyndicateEmbed extends BaseEmbed {
  /**
   * @param {Genesis} bot - An instance of Genesis
   * @param {Array.<SyndicateMission>} missions - The missions to be included in the embed
   * @param {string} syndicate - The syndicate to display the missions for
   * @param {string} platform - Platform
   */
  constructor(bot, missions, syndicate, platform) {
    super();

    const foundSyndicate = values.find(v => syndicate &&
      v.toLowerCase() === syndicate.toLowerCase());
    if (foundSyndicate) {
      this.color = 0x00ff00;
      this.fields = missions.filter(m => m.syndicate === foundSyndicate || foundSyndicate === 'all')
        .map(m => (
          {
            name: m.syndicate,
            value: m.jobs ? `${m.jobs.map(job => `${job.type} | Lvls: ${job.enemyLevels.join(' - ')} ` +
              `| Standing: ${job.standing.reduce((a, b) => a + b, 0)}`).join('\n')}\n\nExpires in ${m.eta}`
              : `${m.nodes.join('\n')}\n\nExpires in ${m.eta}`,
            inline: true,
          }));
    } else {
      this.color = 0xff0000;
      this.fields = [{
        name: 'No such Syndicate',
        value: `Valid values: ${values.join(', ')}`,
      }];
    }
    this.title = `[${platform.toUpperCase()}] Syndicates`;
    this.thumbnail = {
      url: 'https://i.imgur.com/I8CjF9d.png',
    };
  }
}

module.exports = SyndicateEmbed;
