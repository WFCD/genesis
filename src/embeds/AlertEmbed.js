'use strict';

const BaseEmbed = require('./BaseEmbed.js');

/**
 * Generates alert embeds
 */
class AlertEmbed extends BaseEmbed {
  /**
   * @param {Genesis} bot - An instance of Genesis
   * @param {Array.<Alert>} alerts - The alerts to be included in the embed
   */
  constructor(bot, alerts, { platform = 'pc', language = 'en' }) {
    super();
    const upperPlatform = platform.toUpperCase();
    this.thumbnail = {
      url: 'http://i.imgur.com/KQ7f9l7.png',
    };
    this.color = 0xF1C40F;
    if (alerts.length > 1) {
      this.fields = alerts.map(a => ({
        name: bot.stringManager.getString('alert_reward_remaining_short', undefined, {
          language,
          replacements: { reward: a.mission.reward.asString, eta: a.eta },
        }),
        value: bot.stringManager.getString('alert_value_short', undefined, {
          language,
          replacements: {
            faction: a.mission.faction,
            type: a.mission.type,
            minLevel: a.mission.minEnemyLevel,
            node: a.mission.node,
            maxLevel: a.mission.maxEnemyLevel,
          },
        }),
      }));

      this.title = bot.stringManager.getString('alert_title_short', undefined, {
        language, replacements: { platform: upperPlatform },
      });
    } else {
      const a = alerts[0];
      this.title = bot.stringManager.getString('alert_title_short', undefined, {
        language, replacements: { platform: upperPlatform, reward: a.mission.reward.itemString },
      });
      this.color = a.mission.reward.color;
      this.thumbnail.url = a.mission.reward.thumbnail;
      const summary = bot.stringManager.getString('alert_summary_long', undefined, {
        language,
        replacements: { faction: a.mission.faction, type: a.mission.type, node: a.mission.node },
      });
      this.description = a.description || summary;
      this.fields = [];
      if (this.description !== summary) {
        this.fields.push({ name: '_ _', value: summary });
      }
      this.fields.push({ name: bot.stringManager.getString('levels', undefined), value: `${a.mission.minEnemyLevel} - ${a.mission.maxEnemyLevel}`, inline: true });
      this.fields.push({
        name: bot.stringManager.getString('archwingRequired', undefined),
        value: a.mission.archwingRequired ? bot.stringManager.getString('yes', undefined) : bot.stringManager.getString('no', undefined),
        inline: true,
      });

      if (this.title.indexOf('cr') === -1) {
        this.fields.push({
          name: '_ _',
          value: bot.stringManager.getString('credits', undefined, {
            language, replacements: { credits: a.mission.reward.credits },
          }),
          inline: true,
        });
      }
      this.footer.text = bot.stringManager.getString('remaining', undefined, {
        language, replacements: { eta: a.eta },
      });
    }
  }
}

module.exports = AlertEmbed;
