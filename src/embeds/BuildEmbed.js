import BaseEmbed from './BaseEmbed.js';

/**
 * Generates build embeds
 */
export default class BuildEmbed extends BaseEmbed {
  /**
   * @param {Build} build - build to represent
   */
  constructor(build) {
    super();
    const sections = build.body.split(';');
    this.color = 0xf1c40f;
    this.title = build.title;
    this.fields = [];
    sections.forEach((value, index) => {
      if (index === 0) {
        this.description = value;
      } else {
        this.addFields({
          name: '\u200B',
          value,
        });
      }
    });
    this.image = { url: build.url || build.image };
    this.footer.text = `${build.id}${build.isPublic ? ' • Public' : ''} • Owned by ${
      typeof build.owner === 'object' ? build.owner.tag : build.owner
    }`;
  }
}
