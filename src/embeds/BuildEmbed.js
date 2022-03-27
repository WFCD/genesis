import BaseEmbed from './BaseEmbed.js';

/**
 * Generates build embeds
 */
export default class BuildEmbed extends BaseEmbed {
  /**
   * @param {Build} build - The alerts to be included in the embed
   */
  constructor(build) {
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
    this.image = { url: build.url || build.image };
    this.footer.text = `${build.id}${build.isPublic ? ' • Public' : ''} • Owned by ${typeof build.owner === 'object' ? build.owner.tag : build.owner}`;
  }
}
