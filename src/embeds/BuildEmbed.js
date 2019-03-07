'use strict';

const BaseEmbed = require('./BaseEmbed.js');

/**
 * Generates build embeds
 */
class BuildEmbed extends BaseEmbed {
  /**
   * @param {Genesis} bot - An instance of Genesis
   * @param {Build} build - The alerts to be included in the embed
   */
  constructor(bot, build) {
    super();
    const sections = build.body.split(';');
    this.color = 0xF1C40F;
    this.title = build.title;
    this.fields = [];
    sections.forEach((section, index) => {
      if (index === 0) {
        this.description = section;
      } else {
        this.fields.push({ name: '\u200B', value: section });
      }
    });
    this.image = { url: build.url };
    this.footer.text = `${build.id} • Owned by ${typeof build.owner === 'object' ? build.owner.tag : build.owner}`;
  }
}

module.exports = BuildEmbed;
