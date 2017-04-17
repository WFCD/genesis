'use strict';

const BaseEmbed = require('./BaseEmbed.js');

/**
 * Generates fissure embeds
 */
class EventEmbed extends BaseEmbed {
  /**
   * @param {Genesis} bot - An instance of Genesis
   * @param {Array.<Event>} events - The fissures to be included in the embed
   */
  constructor(bot, events) {
    super();

    if (events.length < 2) {
      this.title = 'Worldstate - Events';
      this.description = 'Events';
    }

    if (events.length > 1) {
      this.fields = events.map(e => ({
        name: `${e.description}`,
        value: `Takes place on: ${e.concurrentNodes.join(', ')}\nRewards: ${e.rewards.join(', ')}`,
      }));
    } else if (events.length === 0) {
      this.fields = {
        name: 'Currently no events',
        value: '_ _',
      };
    } else {
      const e = events[0];
      this.title = 'Event! ';
      this.description = `${e.description} against ${e.faction}`;
      this.fields = [
        {
          name: 'Rewards',
          value: e.rewards.join('\n'),
          inline: true,
        },
        {
          name: 'Nodes',
          value: `${e.concurrentNodes.join('\n')}\n${e.node ? e.node : ''}\n${e.victimNode ? e.victimNode : ''}`,
          inline: true,
        },
      ];
      this.footer.text = e.toolTip ? e.toolTip : this.footer.text;
    }

    this.color = events.length > 2 ? 0x00ff00 : 0xff0000;
    this.thumbnail = {
      url: 'https://i.imgur.com/EfIRu6v.png',
    };
  }
}

module.exports = EventEmbed;
