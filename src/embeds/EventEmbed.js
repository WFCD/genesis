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

    if (event) {
      this.title = `[${platform}] ${event.description}`;
      this.fields = [];

      if (event.victimNode) {
        this.fields.push({
          name: '_ _', 
          value: `Defend ${event.victimNode} by attacking the ${event.faction} at ${event.node}.`,
        });
      }
      this.fields.push({ name: 'Rewards', value: event.rewards.map(reward => reward.asString).join('; ') });
      this.fields.push({ name: 'Completion Score', value: String(event.maximumScore) });
    } else {
      this.title = 'No Current Events';
    }
  }
}

module.exports = EventEmbed;
