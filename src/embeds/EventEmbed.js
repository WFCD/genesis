'use strict';

const BaseEmbed = require('./BaseEmbed.js');

/**
 * Generates daily deal embeds
 */
class EventEmbed extends BaseEmbed {
  /**
   * @param {Genesis} bot - An instance of Genesis
   * @param {Event} event - The deal to be included in the embed
   * @param {string} platform - The platform the event is for
   */
  constructor(bot, event, platform) {
    super();

    this.color = 0xfdec96;
    this.url = 'https://ws.warframestat.us/';
    if (event) {
      this.title = `[${platform.toUpperCase()}] ${event.description}`;
      this.fields = [];
      this.description = event.tooltip;

      if (event.victimNode) {
        this.fields.push({
          name: '_ _',
          value: `Defend ${event.victimNode} by attacking the ${event.faction} at ${event.node}.`,
        });
      }
      if (event.rewards) {
        this.fields.push({ name: 'Rewards', value: event.rewards ? event
                          .rewards.map(reward => reward.asString).join('; ') : 'No Rewards' });
      }
      if (event.maximumScore) {
        this.fields.push({ name: 'Completion Score', value: String(event.maximumScore) });
      }
      
      if (event.affiliatedWith) {
        const jobString = event.jobs.map((job) => {
          const rewards = job.rewardPool.length > 0 ? job.rewardPool.map(reward => `* ${reward}`).join('\n') : 'No Clear Reward';
          const rewardsFmtd = `\nWith \`\`\`${rewards}\`\`\` as reward${job.rewardPool.length > 1 ? 's' : ''}.`;
          const desc = `**${job.type}}**\nEnemies lvls ${job.enemyLevels[0]} - ${job.enemyLevels[1]}\n` + 
            `Granting ${event.standingStages.join(' ,')} standing per stage (without modification).${job.rewardPool.length > 0 ? rewards : ''}`;
          return desc;
        }).join('\n');
        this.fields.push({ name: `Jobs from ${event.affiliatedWith}`, value: jobString });
      }

      if (event.health) {
        this.footer.text = `${event.health}% Remaining | ${this.footer.text}`;
      }
    } else {
      this.title = 'No Current Events';
    }
  }
}

module.exports = EventEmbed;
