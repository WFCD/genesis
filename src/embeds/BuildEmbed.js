'use strict';

const BaseEmbed = require('./BaseEmbed.js');

/**
 * Generates alert embeds
 */
class AlertEmbed extends BaseEmbed {
  /**
   * @param {Genesis} bot - An instance of Genesis
   * @param {Build} build - The alerts to be included in the embed
   */
  constructor(bot, build) {
    super();
    this.color = 0xF1C40F;
    this.title = build.title;
    this.fields = [].concat(build.body.split(';').map(section => ({ name: '_ _', value: section })));
    this.image = { url: build.url };
    this.footer.text = `${build.id} | Owned by ${typeof build.owner === 'object' ? build.owner.tag : build.owner}`;
  }
}

module.exports = AlertEmbed;
