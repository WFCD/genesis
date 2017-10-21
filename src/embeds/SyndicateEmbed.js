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

    // Set default fields
    this.color = 0xff0000;
    this.fields = [{
      name: 'No such Syndicate',
      value: `Valid values: ${values.join(', ')}`,
    }];
    this.url = 'https://warframe.com';
    this.thumbnail = {
      url: 'https://i.imgur.com/I8CjF9d.png',
    };
    
    const foundSyndicate = missions.length && values.find(v => syndicate &&
      v.toLowerCase() === syndicate.toLowerCase());
    if (foundSyndicate) {
      const syndMissions = missions.filter(m => m.syndicate === foundSyndicate || foundSyndicate === 'all');
      if (syndMissions.length) {
        this.title = `[${platform.toUpperCase()}] Syndicates`;
        this.color = 0x00ff00;
        const syndMissions = missions.filter(m => m.syndicate === foundSyndicate || foundSyndicate === 'all');
        if (syndMissions.length < 2) {
          this.title = `[${platform.toUpperCase()}] ${syndMissions[0].syndicate}`;
          this.footer.text = `${this.footer.text} | \n\nExpires in ${syndMissions[0].eta}`;
        }
        
        this.fields = syndMissions.map((m) => {
          const jobs = m.jobs.length ? `${m.jobs.map(job => `<:standing:369875864004984832> ${job.standingStages.reduce((a, b) => a + b, 0)} ` +
                `- ${job.type} (${job.enemyLevels.join(' - ')})`).join('\n')}${syndMissions.length < 2 ? '' : `\n\nExpires in ${m.eta}`}` : '';
          const nodes = m.nodes.length ? `${m.nodes.join('\n')}` : '';
          const value = jobs.length ? jobs : (nodes.length ? nodes : 'No Nodes or Jobs Available');
          return {
            name: syndMissions.length < 2 ? '_ _' : m.syndicate,
            value,
            inline: m.jobs.length,
          };
        });
      }
    }
  }
}

module.exports = SyndicateEmbed;
