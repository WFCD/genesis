'use strict';

const BaseEmbed = require('./BaseEmbed.js');

/**
 * Generates enemy embeds
 */
class PriceCheckEmbed extends BaseEmbed {
  /**
   * @param {Genesis} bot - An instance of Genesis
   * @param {Array.<Attachment>} result - array of string results or attachments
   * @param {string} query - query that this is a result for
   */
  constructor(bot, result, query) {
    super();
    this.description = `Price query for ${query}`;
    if (typeof result[0] === 'string') {
      this.color = 0xff0000;
      this.url = 'http://nexus-stats.com';
      this.fields = [
        {
          name: '\u200B',
          value: result[0],
          inline: true,
        },
      ];
      this.footer = {
        icon_url: 'https://cdn.discordapp.com/icons/195582152849620992/4c1fbd47b3e6c8d49b6d2362c79a537b.jpg',
        text: 'Pricechecks provided by Nexus Stats - https://nexus-stats.com',
      };
    } else {
      const attachment = result[0];
      this.color = parseInt(attachment.color, 10);
      this.type = attachment.type;
      this.title = attachment.title;
      this.url = attachment.url;
      this.fields = attachment.fields;
      this.thumbnail = attachment.thumbnail;
      this.footer = attachment.footer;
    }
    if (/.*riven.*/ig.test(query)) {
      this.fields = [
        {
          name: '\u200B',
          value: 'Due to the complexity of Riven mod generation and unveiling, price checks are not guaranteed or reliably provided.',
          inline: true,
        },
      ];
    }
  }
}

module.exports = PriceCheckEmbed;
